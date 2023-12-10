import { Module } from '@nestjs/common';

import { SqsMessageService } from './sqs-message.service';
import { SqsQueueService } from './sqs-queue.service';

@Module({
  imports: [],
  controllers: [],
  providers: [SqsQueueService, SqsMessageService],
  exports: [],
})
export class AwsModule {}
