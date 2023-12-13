import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { MongooseModule } from '@nestjs/mongoose';

import { AwsModule } from './aws/aws.module';
import { OrdersModule } from './orders/orders.module';
import { StatusModule } from './status/status.module';
import { TicketsModule } from './tickets/tickets.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/data'),
    CacheModule.register({
      isGlobal: true,
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || '6379',
    }),
    OrdersModule,
    TicketsModule,
    AwsModule,
    StatusModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class AppModule {}
