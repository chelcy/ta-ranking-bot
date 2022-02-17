import fetch from 'node-fetch';
import {
  LambdaClient,
  InvokeCommand,
  InvocationType,
} from '@aws-sdk/client-lambda';

interface ISection {
  head: string;
  name: string[];
}

interface IAthleticsData {
  [key: string]: ISection[];
}

export async function handler() {
  console.log('---- start');
  try {
    const res = (await fetch('https://www.mchel.net/data/athletics.json').then(
      (r) => r.json(),
    )) as IAthleticsData;
    const athleticNames = Object.entries(res).reduce(
      (prev: string[], [, value]) => {
        return [
          ...prev,
          ...value.map((v) => v.name).reduce((p, n) => [...p, ...n]),
        ];
      },
      [],
    );
    console.log(JSON.stringify(athleticNames));
    await invokeAthleticHandler(athleticNames);
    console.log('task completed');
  } catch (error) {
    console.error('アスレ一覧の取得に失敗しました。');
    console.error(error);
  }
  console.log('---- end');
}

const invokeAthleticHandler = async (athleticNames: string[]) => {
  const id = `${new Date().getTime()}`;
  const client = new LambdaClient({});
  console.log('task id', id);
  await Promise.all(
    athleticNames.map(async (name) => {
      await invoke({ client, id, name });
    }),
  );
};

const invoke = async ({
  client,
  id,
  name,
}: {
  client: LambdaClient;
  id: string;
  name: string;
}) => {
  try {
    const command = new InvokeCommand({
      FunctionName: process.env.RANKING_FUNCTION_ARN,
      InvocationType: InvocationType.Event,
      Payload: new TextEncoder().encode(JSON.stringify({ id, name })),
    });
    await client.send(command);
  } catch (error) {
    console.log('cannnot invoke');
    console.error(error);
  }
};
