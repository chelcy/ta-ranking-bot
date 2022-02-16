#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TaRankingBotStack } from '../lib/ta-ranking-bot-stack';

const app = new cdk.App();
new TaRankingBotStack(app, 'TaRankingBotStack', {});
