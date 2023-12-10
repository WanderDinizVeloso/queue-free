import { Module } from '@nestjs/common';
import { sqsQueueService } from './sqsQueue.service';

@Module({
  imports: [],
  controllers: [],
  providers: [sqsQueueService],
  exports: [],
})
export class AwsModule {}
