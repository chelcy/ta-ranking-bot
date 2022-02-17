import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import {
  AttributeType,
  BillingMode,
  Table,
  TableClass,
  TableEncryption,
} from 'aws-cdk-lib/aws-dynamodb';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { Effect, ManagedPolicy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import {
  Charset,
  LogLevel,
  NodejsFunction,
  SourceMapMode,
} from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

export class TaRankingBotStack extends Stack {
  private readonly handlerGetAthletics: NodejsFunction;
  private readonly rankingTable: Table;
  private readonly handlerGetRanking: NodejsFunction;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.rankingTable = this.createRankingTable();

    this.handlerGetRanking = this.createLambdaGetRanking();

    this.handlerGetAthletics = this.createLambdaGetAthletics();

    this.createEventRule();
  }

  private createRankingTable() {
    const table = new Table(this, 'RankingTable', {
      partitionKey: {
        name: 'name',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      tableClass: TableClass.STANDARD,
      billingMode: BillingMode.PAY_PER_REQUEST,
      encryption: TableEncryption.DEFAULT,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    return table;
  }

  private createLambdaGetRanking() {
    const {
      TWITTER_API_KEY = '',
      TWITTER_API_KEY_SECRET = '',
      TWITTER_ACCESS_TOKEN = '',
      TWITTER_ACCESS_TOKEN_SECRET = '',
    } = process.env;

    const lambda = new NodejsFunction(this, 'GetRankingFunction', {
      entry: 'src/lambda/handlers/get_ranking/index.ts',
      bundling: {
        minify: true,
        sourceMap: true,
        sourceMapMode: SourceMapMode.INLINE,
        sourcesContent: false,
        target: 'es2020',
        logLevel: LogLevel.INFO,
        charset: Charset.UTF8,
      },
      timeout: Duration.seconds(30),
      memorySize: 256,
      reservedConcurrentExecutions: 1,
      environment: {
        TWITTER_API_KEY,
        TWITTER_API_KEY_SECRET,
        TWITTER_ACCESS_TOKEN,
        TWITTER_ACCESS_TOKEN_SECRET,
        RANKING_TABLE_NAME: this.rankingTable.tableName,
        REGION: this.region,
      },
    });
    lambda.role?.addToPrincipalPolicy(
      new PolicyStatement({
        actions: ['dynamodb:*'],
        resources: ['*'],
        effect: Effect.ALLOW,
      }),
    );
    return lambda;
  }

  private createLambdaGetAthletics() {
    const lambda = new NodejsFunction(this, 'GetAthleticsFunction', {
      entry: 'src/lambda/handlers/get_athletics/index.ts',
      bundling: {
        minify: true,
        sourceMap: true,
        sourceMapMode: SourceMapMode.INLINE,
        sourcesContent: false,
        target: 'es2020',
        logLevel: LogLevel.INFO,
        charset: Charset.UTF8,
      },
      timeout: Duration.seconds(30),
      memorySize: 256,
      reservedConcurrentExecutions: 1,
      environment: {
        RANKING_FUNCTION_ARN: this.handlerGetRanking.functionArn,
      },
    });
    lambda.role?.addToPrincipalPolicy(
      new PolicyStatement({
        actions: ['lambda:InvokeFunction'],
        resources: ['*'],
        effect: Effect.ALLOW,
      }),
    );
    return lambda;
  }

  private createEventRule() {
    new Rule(this, 'GetAthleticsRule', {
      schedule: Schedule.cron({
        minute: '0',
      }),
      targets: [
        new LambdaFunction(this.handlerGetAthletics, { retryAttempts: 1 }),
      ],
    });
  }
}
