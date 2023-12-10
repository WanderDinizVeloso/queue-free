import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Ticket, TicketDocument } from './schema/ticket.schema';
import { EIGHT_HOURS, TEN_SECONDS } from 'src/utils/redis-times';
import { notFound, removed } from 'src/utils/messages-response';

const TICKET = 'ticket';
const TICKETS = 'tickets';

@Injectable()
export class TicketsService {
  constructor(
    @InjectModel(Ticket.name) private ticketModel: Model<TicketDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(orderId: string): Promise<{ _id: string; ticketNumber: number }> {
    const ticketNumber = await this.ticketNumberGenerate();

    const ticket = await this.ticketModel.create({
      ticketNumber,
      orderId,
      active: true,
    });

    await this.cacheManager.set(ticket._id, ticket, EIGHT_HOURS);

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