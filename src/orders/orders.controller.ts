import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { IPatchAndDeleteReturn, IPostReturn } from './interface/order.interface';
import { OrdersService } from './orders.service';
import { Order } from './schema/order.schema';

const SUMMARY_MESSAGE = {
  create: 'Create order.',
  findAll: 'Search all orders.',
  findOne: 'Search for a order by ID.',
  update: 'Update order data by ID.',
  remove: 'Remove order by ID.',
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

  @Patch(':id')
  @ApiOperation({ summary: SUMMARY_MESSAGE.update })
  async update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ): Promise<IPatchAndDeleteReturn> {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: SUMMARY_MESSAGE.remove })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.ordersService.remove(id);
  }
}
