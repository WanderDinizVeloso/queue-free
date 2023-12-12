import { Message, SQS } from '@aws-sdk/client-sqs';
import { Injectable } from '@nestjs/common';

import { config } from './aws-config';

interface IPayload {
  QueueUrl: string;
  MessageBody: string;
  MessageGroupId?: string;
}

@Injectable()
export class SqsService {
  private AwsSQS: SQS;
  constructor() {
    this.AwsSQS = new SQS(config);
  }

  async createQueue(QueueName: string, FifoQueue: boolean = false): Promise<string> {
    const { QueueUrl } = await this.AwsSQS.createQueue({
      QueueName: FifoQueue && !QueueName.includes('.fifo') ? `${QueueName}.fifo` : QueueName,
      Attributes: {
        FifoQueue: `${FifoQueue}`,
        ContentBasedDeduplication: FifoQueue ? 'true' : 'false',
      },
    });

    return QueueUrl;
  }

  async deleteQueue(QueueUrl: string): Promise<void> {
    await this.AwsSQS.deleteQueue({ QueueUrl });
  }

  async deleteMessage(QueueUrl: string, ReceiptHandle: string): Promise<void> {
    await this.AwsSQS.deleteMessage({ QueueUrl, ReceiptHandle });
  }

  async getQueueUrl(QueueName: string): Promise<string> {
    try {
      const { QueueUrl } = await this.AwsSQS.getQueueUrl({ QueueName });

      return QueueUrl;
    } catch (error) {
      if (error.message === 'The specified queue does not exist.') {
        return;
      }
    }
  }

  async listQueues(): Promise<string[]> {
    const { QueueUrls } = await this.AwsSQS.listQueues({});

    return QueueUrls;
  }

  async receiveMessage(QueueUrl: string, MaxNumberOfMessages: number): Promise<Message[]> {
    const { Messages } = await this.AwsSQS.receiveMessage({ QueueUrl, MaxNumberOfMessages });

    return Messages;
  }

  async sendMessage(QueueUrl: string, MessageBody: string, MessageGroupId?: string): Promise<void> {
    const payload: IPayload = {
      QueueUrl,
      MessageBody,
    };

    if (QueueUrl.includes('.fifo')) {
      payload.MessageGroupId = MessageGroupId || QueueUrl;
    }

    await this.AwsSQS.sendMessage(payload);
  }
}
