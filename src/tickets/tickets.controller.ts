import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { TicketsService } from './tickets.service';
import { IQueueTicketResponse } from './interface/ticket.interface';

const SUMMARY_MESSAGE = {
  queueReceiveMessage: 'Search for a ticket in queue.',
};

@ApiTags('Tickets')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @ApiOperation({ summary: SUMMARY_MESSAGE.queueReceiveMessage })
  queueReceiveMessage(): Promise<IQueueTicketResponse | string> {
    return this.ticketsService.queueReceiveMessage();
  }
}
