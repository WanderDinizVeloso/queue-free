import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { IPatchAndDeleteReturn, IPostReturn } from './interface/order.interface';
import { Order, OrderDocument } from './schema/order.schema';
import { TicketsService } from 'src/tickets/tickets.service';
import { EIGHT_HOURS, TEN_SECONDS } from 'src/utils/redis-times';

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
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private ticketService: TicketsService,
  ) {}
  async create(createOrderDto: CreateOrderDto): Promise<IPostReturn> {
    const order = await this.orderModel.create({ ...createOrderDto, active: true });

    await this.cacheManager.set(order._id, order, EIGHT_HOURS);

    const ticket = await this.ticketService.create(order._id);

    return { _id: order._id, ticket, message: MESSAGES.orderCreated };
  }

  async findAll(): Promise<Order[]> {
    const ordersCache: Order[] = await this.cacheManager.get('orders');

    if (!ordersCache) {
      const orders = await this.orderModel.find();

      await this.cacheManager.set('orders', orders, TEN_SECONDS);

      return orders;
    }

    return ordersCache;
  }

  async findOne(id: string): Promise<Order> {
    const order: Order =
      (await this.cacheManager.get(id)) || (await this.orderModel.findOne({ _id: id }));

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

    await this.cacheManager.set(id, order, EIGHT_HOURS);

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

    await this.cacheManager.del(id);

    return { message: MESSAGES.orderRemoved };
  }
}
