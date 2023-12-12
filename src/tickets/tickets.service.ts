import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { IQueueMessagePayload, IQueueTicketResponse } from './interface/ticket.interface';
import { Ticket, TicketDocument } from './schema/ticket.schema';
import { SqsService } from 'src/aws/sqs.service';
import { OrdersService } from 'src/orders/orders.service';
import { EIGHT_HOURS, TEN_SECONDS } from 'src/utils/redis-times';
import { notFound, removed } from 'src/utils/messages-response';

const TICKET = 'ticket';
const TICKETS = 'tickets';
const QUEUE_NAME_FIFO = `${TICKETS}.fifo`;

@Injectable()
export class TicketsService {
  constructor(
    @InjectModel(Ticket.name) private ticketModel: Model<TicketDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private sqsService: SqsService,
    @Inject(forwardRef(() => OrdersService)) private orderService: OrdersService,
  ) {}

  async create(orderId: string): Promise<{ _id: string; ticketNumber: number }> {
    const ticketNumber = await this.ticketNumberGenerate();

    const ticket = await this.ticketModel.create({
      ticketNumber,
      orderId,
      active: true,
    });

    await this.cacheManager.set(ticket._id, ticket, EIGHT_HOURS);

    await this.queueSendMessage(orderId, ticketNumber);

    return { _id: ticket._id, ticketNumber };
  }

  async findAll(): Promise<Ticket[]> {
    const ticketsCache: Ticket[] = await this.cacheManager.get(TICKETS);

    if (!ticketsCache) {
      const tickets = await this.ticketModel.find();

      await this.cacheManager.set(TICKETS, tickets, TEN_SECONDS);

      return tickets;
    }

    return ticketsCache;
  }

  async findOne(id: string): Promise<Ticket> {
    const ticket: Ticket =
      (await this.cacheManager.get(id)) || (await this.ticketModel.findOne({ _id: id }));

    if (!ticket) {
      throw new NotFoundException(notFound(TICKET));
    }

    return ticket;
  }

  private async queueSendMessage(orderId: string, ticketNumber: number): Promise<void> {
    const payload: IQueueMessagePayload = { orderId, ticketNumber };

    const queueUrl =
      (await this.sqsService.getQueueUrl(QUEUE_NAME_FIFO)) ||
      (await this.sqsService.createQueue(QUEUE_NAME_FIFO, true));

    await this.sqsService.sendMessage(queueUrl, JSON.stringify(payload));
  }

  async receiveTicketMessage(): Promise<IQueueTicketResponse | string> {
    const MESSAGE_MAX_NUMBER = 1;
    const FIRST_INDEX = 0;

    const queueUrl = await this.sqsService.getQueueUrl(QUEUE_NAME_FIFO);

    const messageList = await this.sqsService.receiveMessage(queueUrl, MESSAGE_MAX_NUMBER);

    if (messageList.length) {
      const message = messageList[FIRST_INDEX];

      await this.sqsService.deleteMessage(queueUrl, message.ReceiptHandle);

      const { orderId, ticketNumber } = JSON.parse(message.Body);
      const { _id, customerName, description } = await this.orderService.findOne(orderId);

      return { ticketNumber, order: { _id, customerName, description } };
    }

    return 'There is no ticket in the queue.';
  }

  async remove(id: string): Promise<{ message: string }> {
    const ticket = await this.ticketModel.findOneAndUpdate(
      { _id: id, active: true },
      { active: false },
      { new: true },
    );

    if (!ticket) {
      throw new NotFoundException(notFound(TICKET));
    }

    await this.cacheManager.del(id);

    return { message: removed(TICKET) };
  }

  private async ticketNumberGenerate(): Promise<number> {
    const ONE = 1;

    const tickets = await this.ticketModel.find();

    return tickets.length + ONE;
  }
}
