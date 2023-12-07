import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Ticket, TicketDocument } from './schema/ticket.schema';
import { Model } from 'mongoose';

export const MESSAGES = {
  ticketCreated: 'ticket created successfully.',
  ticketRemoved: 'ticket removed successfully.',
  ticketNotFound: 'ticket not found or not active.',
};

@Injectable()
export class TicketsService {
  constructor(@InjectModel(Ticket.name) private ticketModel: Model<TicketDocument>) {}

  async create(orderId: string): Promise<{ _id: string; ticketNumber: number }> {
    const ticketNumber = await this.ticketNumberGenerate();

    const { _id } = await this.ticketModel.create({
      ticketNumber,
      orderId,
      active: true,
    });

    return { _id, ticketNumber };
  }

  async findAll(): Promise<Ticket[]> {
    return this.ticketModel.find();
  }

  async findOne(id: number): Promise<Ticket> {
    const ticket = await this.ticketModel.findOne({ _id: id });

    if (!ticket) {
      throw new NotFoundException(MESSAGES.ticketNotFound);
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
      throw new NotFoundException(MESSAGES.ticketNotFound);
    }

    return { message: MESSAGES.ticketRemoved };
  }

  private async ticketNumberGenerate(): Promise<number> {
    const ONE = 1;
    const tickets = await this.ticketModel.find();

    return tickets.length + ONE;
  }
}
