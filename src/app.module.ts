import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { MongooseModule } from '@nestjs/mongoose';

import { OrdersModule } from './orders/orders.module';
import { TicketsModule } from './tickets/tickets.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI),
    CacheModule.register({
      isGlobal: true,
      host: process.env.REDIS_HOST,
      port: process.env.PORT,
    }),
    OrdersModule,
    TicketsModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class AppModule {}
