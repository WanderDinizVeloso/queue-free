import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { TicketsService } from './tickets.service';
import { Ticket, TicketSchema } from './schema/ticket.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Ticket.name, schema: TicketSchema }])],
  controllers: [],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
