import { SQS } from '@aws-sdk/client-sqs';
import { Injectable } from '@nestjs/common';

import { config } from './aws-config';

@Injectable()
export class SqsQueueService {
  private AwsSQS: SQS;
  constructor() {
    this.AwsSQS = new SQS(config);
  }

  async create(QueueName: string, FifoQueue: boolean = false): Promise<string> {
    const { QueueUrl } = await this.AwsSQS.createQueue({
      QueueName,
      Attributes: { FifoQueue: `${FifoQueue}` },
    });

    return QueueUrl;
  }
  async findAll(): Promise<string[]> {
    const { QueueUrls } = await this.AwsSQS.listQueues({});

    return QueueUrls;
  }

  async findURL(QueueName: string): Promise<string> {
    const { QueueUrl } = await this.AwsSQS.getQueueUrl({ QueueName });

    return QueueUrl;
  }

  async remove(QueueUrl: string): Promise<void> {
    await this.AwsSQS.deleteQueue({ QueueUrl });
  }
}
