import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Ticket, TicketSchema } from './schema/ticket.schema';
import { AwsModule } from 'src/aws/aws.module';
import { OrdersModule } from 'src/orders/orders.module';
import { StatusModule } from 'src/status/status.module';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Ticket.name, schema: TicketSchema }]),
    forwardRef(() => OrdersModule),
    AwsModule,
    StatusModule,
  ],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
