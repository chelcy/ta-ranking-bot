import { handler } from './index';

handler(
  {
    Records: [
      {
        messageId: '',
        receiptHandle: '',
        body: '{"id":"1644750044859","name":"DIVE into SUMMER!!!!!"}',
        attributes: {
          ApproximateReceiveCount: '1',
          SentTimestamp: '',
          SenderId: '',
          ApproximateFirstReceiveTimestamp: '',
        },
        messageAttributes: {},
        md5OfBody: '',
        eventSource: 'aws:sqs',
        eventSourceARN: '',
        awsRegion: '',
      },
    ],
  },
  {
    callbackWaitsForEmptyEventLoop: true,
    succeed: (v: any) => {},
    fail: (v: any) => {},
    done: (v: any) => {},
    functionVersion: '',
    functionName: '',
    memoryLimitInMB: '',
    logGroupName: '',
    logStreamName: '',
    clientContext: undefined,
    identity: undefined,
    invokedFunctionArn: '',
    awsRequestId: '',
    getRemainingTimeInMillis: () => {
      return 1;
    },
  },
);
