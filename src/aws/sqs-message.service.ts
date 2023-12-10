import { Message, SQS } from '@aws-sdk/client-sqs';
import { Injectable } from '@nestjs/common';

import { config } from './aws-config';

@Injectable()
export class SqsMessageService {
  private AwsSQS: SQS;
  constructor() {
    this.AwsSQS = new SQS(config);
  }
  async receive(QueueUrl: string, MaxNumberOfMessages: number): Promise<Message[]> {
    const { Messages } = await this.AwsSQS.receiveMessage({ QueueUrl, MaxNumberOfMessages });

    return Messages;
  }

  async send(QueueUrl: string, MessageBody: string): Promise<void> {
    await this.AwsSQS.sendMessage({ QueueUrl, MessageBody });
  }

  async delete(QueueUrl: string, ReceiptHandle: string): Promise<void> {
    await this.AwsSQS.deleteMessage({ QueueUrl, ReceiptHandle });
  }
}
