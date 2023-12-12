import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CreateOrderDto } from './dto/create-order.dto';
import { IPostReturn } from './interface/order.interface';
import { OrdersService } from './orders.service';
import { Order } from './schema/order.schema';

const SUMMARY_MESSAGE = {
  create: 'Create order.',
  findAll: 'Search all orders.',
  findOne: 'Search for a order by ID.',
};

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: SUMMARY_MESSAGE.create })
  async create(@Body() createOrderDto: CreateOrderDto): Promise<IPostReturn> {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: SUMMARY_MESSAGE.findAll })
  async findAll(): Promise<Order[]> {
    return this.ordersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: SUMMARY_MESSAGE.findOne })
  async findOne(@Param('id') id: string): Promise<Order> {
    return this.ordersService.findOne(id);
  }
}
