import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { TicketsService } from './tickets.service';
import { IQueueTicketResponse } from './interface/ticket.interface';

const SUMMARY_MESSAGE = {
  finishManufacturing: 'Completes ticket production.',
  queueReceiveMessage: 'Search for a ticket in queue.',
};

@ApiTags('Tickets')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post(':id')
  @ApiOperation({ summary: SUMMARY_MESSAGE.finishManufacturing })
  finishManufacturing(@Param('id') id: string): Promise<{ message: string }> {
    return this.ticketsService.finishManufacturing(id);
  }

  @Get()
  @ApiOperation({ summary: SUMMARY_MESSAGE.queueReceiveMessage })
  queueReceiveMessage(): Promise<IQueueTicketResponse | { message: string }> {
    return this.ticketsService.queueReceiveMessage();
  }
}
