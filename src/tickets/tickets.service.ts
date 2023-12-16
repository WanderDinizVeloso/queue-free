import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { IQueueMessagePayload, IQueueTicketResponse } from './interface/ticket.interface';
import { Ticket, TicketDocument } from './schema/ticket.schema';
import { SqsService } from 'src/aws/sqs.service';
import { OrdersService } from 'src/orders/orders.service';
import { StatusService } from 'src/status/status.service';
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
    private statusService: StatusService,
  ) {}

  async create(orderId: string): Promise<{ _id: string; ticketNumber: number }> {
    const ticketNumber = await this.ticketNumberGenerate();

    const ticket = await this.ticketModel.create({
      ticketNumber,
      orderId,
      active: true,
    });

    await Promise.all([
      this.cacheManager.set(ticket._id, ticket, EIGHT_HOURS),
      this.statusService.update(orderId, { ticketCreatedAt: new Date() }),
      this.queueSendMessage(orderId, ticket._id, ticketNumber),
    ]);

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

  async finishManufacturing(id: string): Promise<{ message: string }> {
    const ticket = await this.findOne(id);

    if (!ticket) {
      throw new NotFoundException(notFound(TICKET));
    }

    const status = await this.statusService.findOne(ticket.orderId);

    if (!status.manufacturingStartedAt) {
      throw new BadRequestException('product manufacturing not yet started.');
    }

    if (status.manufacturingFinishedAt) {
      throw new BadRequestException('manufacturing of the product already completed.');
    }

    await this.statusService.update(ticket.orderId, { manufacturingFinishedAt: new Date() });

    return { message: 'manufacturing carried out successfully.' };
  }

  async queueReceiveMessage(): Promise<IQueueTicketResponse | { message: string }> {
    const MESSAGE_MAX_NUMBER = 1;
    const FIRST_INDEX = 0;

    const queueUrl = await this.sqsService.getQueueUrl(QUEUE_NAME_FIFO);

    const messageList = await this.sqsService.receiveMessage(queueUrl, MESSAGE_MAX_NUMBER);

    if (messageList.length) {
      const message = messageList[FIRST_INDEX];

      const { orderId, ticketId, ticketNumber } = JSON.parse(message.Body);

      const [{ _id, customerName, description }] = await Promise.all([
        this.orderService.findOne(orderId),
        this.sqsService.deleteMessage(queueUrl, message.ReceiptHandle),
        this.statusService.update(orderId, {
          receivedQueueMessageAt: new Date(),
          manufacturingStartedAt: new Date(),
        }),
      ]);

      return { ticketNumber, ticketId, order: { _id, customerName, description } };
    }

    return { message: 'There is no ticket in the queue.' };
  }

  private async queueSendMessage(
    orderId: string,
    ticketId: string,
    ticketNumber: number,
  ): Promise<void> {
    const payload: IQueueMessagePayload = { orderId, ticketId, ticketNumber };

    const queueUrl =
      (await this.sqsService.getQueueUrl(QUEUE_NAME_FIFO)) ||
      (await this.sqsService.createQueue(QUEUE_NAME_FIFO, true));

    await Promise.all([
      this.sqsService.sendMessage(queueUrl, JSON.stringify(payload)),
      this.statusService.update(orderId, { sendQueueMessageAt: new Date() }),
    ]);
  }

  async remove(id: string): Promise<{ message: string }> {
    await Promise.all([
      this.ticketModel.findOneAndUpdate(
        { _id: id, active: true },
        { active: false },
        { new: true },
      ),
      this.cacheManager.del(id),
    ]);

    return { message: removed(TICKET) };
  }

  private async ticketNumberGenerate(): Promise<number> {
    const ONE = 1;

    const tickets = await this.ticketModel.find();

    return tickets.length + ONE;
  }
}
