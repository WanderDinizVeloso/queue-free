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

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { IPatchAndDeleteReturn, IPostReturn } from './interface/order.interface';
import { Order, OrderDocument } from './schema/order.schema';
import { TicketsService } from 'src/tickets/tickets.service';
import { created, notFound, removed, updated } from 'src/utils/messages-response';
import { EIGHT_HOURS, TEN_SECONDS } from 'src/utils/redis-times';
import { StatusService } from 'src/status/status.service';

const ORDER = 'order';
const ORDERS = 'orders';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @Inject(forwardRef(() => TicketsService)) private readonly ticketService: TicketsService,
    private readonly statusService: StatusService,
  ) {}

  async completeOrder(id: string): Promise<{ message: string }> {
    const order = await this.findOne(id);

    const status = await this.statusService.findOne(order._id);

    if (!order.active) {
      throw new BadRequestException('order already completed');
    }

    if (!status.manufacturingFinishedAt) {
      throw new BadRequestException('product manufacturing not yet finished');
    }

    await Promise.all([
      this.remove(id),
      this.ticketService.remove(status.ticketId),
      this.statusService.remove(order._id),
    ]);

    return { message: 'order placed successfully' };
  }

  async create(createOrderDto: CreateOrderDto): Promise<IPostReturn> {
    const order = await this.orderModel.create({ ...createOrderDto, active: true });

    const [ticket] = await Promise.all([
      this.ticketService.create(order._id),
      this.cacheManager.set(order._id, order, EIGHT_HOURS),
      this.statusService.create(order._id),
    ]);

    await this.statusService.update(order._id, { ticketId: ticket._id });

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

    await this.cacheManager.set(id, order, EIGHT_HOURS);

    return { message: updated(ORDER) };
  }

  async remove(id: string): Promise<{ message: string }> {
    await Promise.all([
      this.orderModel.findOneAndUpdate({ _id: id, active: true }, { active: false }, { new: true }),
      this.cacheManager.del(id),
    ]);

    return { message: removed(ORDER) };
  }
}
