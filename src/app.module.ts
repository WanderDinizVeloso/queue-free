import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersModule } from './orders/orders.module';
import { TicketsModule } from './tickets/tickets.module';

@Module({
  imports: [MongooseModule.forRoot(process.env.MONGO_URI), OrdersModule, TicketsModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class AppModule {}
