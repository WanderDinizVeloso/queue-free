import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { IPatchAndDeleteReturn, IPostReturn } from './interface/order.interface';
import { Order, OrderDocument } from './schema/order.schema';
import { TicketsService } from 'src/tickets/tickets.service';
import { created, notFound, removed, updated } from 'src/utils/messages-response';
import { EIGHT_HOURS, TEN_SECONDS } from 'src/utils/redis-times';

const ORDER = 'order';
const ORDERS = 'orders';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(forwardRef(() => TicketsService)) private ticketService: TicketsService,
  ) {}
  async create(createOrderDto: CreateOrderDto): Promise<IPostReturn> {
    const order = await this.orderModel.create({ ...createOrderDto, active: true });

    await this.cacheManager.set(order._id, order, EIGHT_HOURS);

    const ticket = await this.ticketService.create(order._id);

    return { _id: order._id, ticket, message: created(ORDER) };
  }

  async findAll(): Promise<Order[]> {
    const ordersCache: Order[] = await this.cacheManager.get(ORDERS);

    if (!ordersCache) {
      const orders = await this.orderModel.find();

      await this.cacheManager.set(ORDERS, orders, TEN_SECONDS);

      return orders;
    }

    return ordersCache;
  }

  async findOne(id: string): Promise<Order> {
    const order: Order =
      (await this.cacheManager.get(id)) || (await this.orderModel.findOne({ _id: id }));

    if (!order) {
      throw new NotFoundException(notFound(ORDER));
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
      throw new NotFoundException(notFound(ORDER));
    }

    await this.cacheManager.set(id, order, EIGHT_HOURS);

    return { message: updated(ORDER) };
  }

  async remove(id: string): Promise<{ message: string }> {
    const order = await this.orderModel.findOneAndUpdate(
      { _id: id, active: true },
      { active: false },
      { new: true },
    );

    if (!order) {
      throw new NotFoundException(notFound(ORDER));
    }

    await this.cacheManager.del(id);

    return { message: removed(ORDER) };
  }
}
