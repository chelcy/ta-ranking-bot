import { TwitterApi } from 'twitter-api-v2';
import fetch from 'node-fetch';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import {
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
} from '@aws-sdk/client-dynamodb';

interface IRankingRow {
  name: string;
  rank: number;
  time: number;
  epoch: number;
}

interface IAthleticInfo {
  id: string;
  name: string;
}

interface ITableRow extends IAthleticInfo {
  ranking: string;
}

export async function handler(athleticInfo: IAthleticInfo) {
  console.log('athleticInfo', athleticInfo);

  // DynamoDBから最新のIDのアスレデータを取得
  const latestRankingData = await getRankingFromTable(athleticInfo);
  console.log('latestRankingData', latestRankingData);

  // 最新データがないか、DynamoDBの最新のアスレデータが受信したID/アスレ名と一致したら終了
  if (!latestRankingData || latestRankingData.id === athleticInfo.id) {
    return;
  }

  // apiからアスレデータの取得
  const apiRes = await getRankingFromAPI(athleticInfo.name);
  console.log('apiRes', apiRes);

  // apiからの返りが空なら終了
  if (apiRes.length === 0) {
    return;
  }

  // apiから取得したデータをDynamoDBに保存
  await saveData(athleticInfo, apiRes);

  // アスレデータを比較し、変更があればツイート
  // 方針: top10のepoch+nameの組み合わせが前回のtop10の組み合わせに含まれていない場合新レコードであるため更新通知対象
  await checkRankingChange(
    athleticInfo,
    JSON.parse(latestRankingData.ranking || '{}') as IRankingRow[],
    apiRes,
  );
}

/**
 * get ranking data from table
 * @param athleticInfo
 * @returns
 */
const getRankingFromTable = async (athleticInfo: IAthleticInfo) => {
  const client = getDynamoClient();

  const command = new QueryCommand({
    TableName: process.env.RANKING_TABLE_NAME,
    ScanIndexForward: false,
    KeyConditionExpression: '#name = :name',
    ExpressionAttributeNames: {
      '#name': 'name',
    },
    ExpressionAttributeValues: {
      ':name': {
        S: athleticInfo.name,
      },
    },
    Limit: 1,
  });

  const res = await client.send(command);

  if (res.Count && res.Count > 0) {
    const item = res.Items?.[0];
    return {
      id: item?.id.S,
      name: item?.name.S,
      ranking: item?.ranking.S,
    } as ITableRow;
  } else {
    return null;
  }
};

/**
 * アスレランキングを返す
 * @param athleticName アスレチック名
 * @returns top 10 of ranking
 */
const getRankingFromAPI = async (
  athleticName: string,
): Promise<IRankingRow[]> => {
  const rankingRes = (await fetch(
    `https://api.mchel.net/v1/athletic/${encodeURIComponent(
      athleticName,
    )}/ranking`,
  ).then((r) => r.json())) as IRankingRow[];
  console.log('rankingRes', rankingRes);
  return (rankingRes || []).filter((value) => value.rank <= 10);
};

/**
 * dynamodbに保存する
 * @param athleticInfo
 * @param ranking
 */
const saveData = async (
  athleticInfo: IAthleticInfo,
  ranking: IRankingRow[],
) => {
  const client = getDynamoClient();

  const command = new PutItemCommand({
    TableName: process.env.RANKING_TABLE_NAME,
    Item: {
      name: {
        S: athleticInfo.name,
      },
      id: {
        S: athleticInfo.id,
      },
      ranking: {
        S: JSON.stringify(ranking),
      },
    },
  });

  await client.send(command);
};

/**
 * dynamodb client
 * @returns client
 */
const getDynamoClient = () => {
  const provider = defaultProvider({});
  const client = new DynamoDBClient({
    credentials: provider,
    region: process.env.REGION,
  });
  return client;
};

const checkRankingChange = async (
  athleticInfo: IAthleticInfo,
  oldRanking: IRankingRow[],
  newRanking: IRankingRow[],
) => {
  // oldのepochとnameの組み合わせ
  const oldCom = oldRanking.map((r) => rankingRowToEpochName(r));

  // oldに入ってないものだけを取り出し
  const tweetTarget = newRanking.filter(
    (r) => !oldCom.includes(rankingRowToEpochName(r)),
  );

  console.log('tweetTarget', tweetTarget);

  if (tweetTarget.length === 0) {
    return;
  }

  await tweet(
    [
      `【TAランキング変動通知】`,
      '',
      `「${athleticInfo.name}」のTAランキング上位10記録に変動がありました。`,
      ...tweetTarget.map(
        (t) =>
          `・${t.name} さんが ${t.rank}位 にランクイン (${msToTime(t.time)})`,
      ),
      '',
      `https://www.mchel.net/info#athletic:ranking:${encodeURIComponent(
        athleticInfo.name,
      )}`,
    ].join('\n'),
  );
};

const rankingRowToEpochName = (data: IRankingRow) =>
  `${data.epoch}-${data.name}`;

const msToTime = (duration: number) => {
  // from https://qiita.com/mtane0412/items/7106012c79d3365d3340
  const hour = Math.floor(duration / 3600000);
  const minute = Math.floor((duration - 3600000 * hour) / 60000);

  const hh = ('00' + hour).slice(-2);
  const mm = ('00' + minute).slice(-2);
  const ms = ('00000' + (duration % 60000)).slice(-5);

  const time = `${hh}:${mm}:${ms.slice(0, 2)}.${ms.slice(2, 5)}`;

  return time;
};

/**
 * post tweet
 * @param message message
 */
const tweet = async (message: string) => {
  const twitterClient = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY || '',
    appSecret: process.env.TWITTER_API_KEY_SECRET || '',
    accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET || '',
  });

  try {
    await twitterClient.v1.tweet(message);
  } catch (error) {
    console.warn('tweet error', message, error);
  }
};
