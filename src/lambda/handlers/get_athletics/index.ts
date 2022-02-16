import fetch from 'node-fetch';
import {
  SQSClient,
  SendMessageCommand,
  SendMessageCommandInput,
} from '@aws-sdk/client-sqs';

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
    await addAthleticsToQueue(athleticNames);
    console.log('task completed');
  } catch (error) {
    console.error('アスレ一覧の取得に失敗しました。');
    console.error(error);
  }
  console.log('---- end');
}

const addAthleticsToQueue = async (athleticNames: string[]) => {
  const id = `${new Date().getTime()}`;
  const client = new SQSClient({});
  console.log('task id', id);
  await Promise.all(
    athleticNames.map(async (name) => {
      await addMessage({ client, id, name });
    }),
  );
};

const addMessage = async ({
  client,
  id,
  name,
}: {
  client: SQSClient;
  id: string;
  name: string;
}) => {
  const params: SendMessageCommandInput = {
    QueueUrl: process.env.QUEUE_URL,
    MessageBody: JSON.stringify({ id, name }),
  };

  const command = new SendMessageCommand(params);

  await client.send(command);
};
