import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { IPatchAndDeleteReturn, IPostReturn } from './interface/order.interface';
import { Order, OrderDocument } from './schema/order.schema';
import { TicketsService } from 'src/tickets/tickets.service';

export const MESSAGES = {
  orderCreated: 'order created successfully.',
  orderUpdated: 'order updated successfully.',
  orderRemoved: 'order removed successfully.',
  orderNotFound: 'order not found or not active.',
};

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private ticketService: TicketsService,
  ) {}
  async create(createOrderDto: CreateOrderDto): Promise<IPostReturn> {
    const { _id } = await this.orderModel.create({ ...createOrderDto, active: true });

    const ticket = await this.ticketService.create(_id);

    return { _id, ticket, message: MESSAGES.orderCreated };
  }

  async findAll(): Promise<Order[]> {
    return this.orderModel.find();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderModel.findOne({ _id: id });

    if (!order) {
      throw new NotFoundException(MESSAGES.orderNotFound);
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<IPatchAndDeleteReturn> {
    const order = await this.orderModel.findOneAndUpdate(
      { _id: id, active: true },
      updateOrderDto,
      { new: true },
    );

    if (!order) {
      throw new NotFoundException(MESSAGES.orderNotFound);
    }

    return { message: MESSAGES.orderUpdated };
  }

  async remove(id: string): Promise<{ message: string }> {
    const order = await this.orderModel.findOneAndUpdate(
      { _id: id, active: true },
      { active: false },
      { new: true },
    );

    if (!order) {
      throw new NotFoundException(MESSAGES.orderNotFound);
    }

    return { message: MESSAGES.orderRemoved };
  }
}
