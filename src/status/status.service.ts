import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Status, StatusDocument } from './schema/status.schema';
import { IStatusUpdatePayload } from './interface/status.interface';
import { EIGHT_HOURS, TEN_SECONDS } from 'src/utils/redis-times';
import { notFound } from 'src/utils/messages-response';

const STATUS = 'status';

@Injectable()
export class StatusService {
  constructor(
    @InjectModel(Status.name) private readonly statusModel: Model<StatusDocument>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async create(orderId: string): Promise<void> {
    const status = await this.statusModel.create({
      orderId,
      orderCreatedAt: new Date(),
      active: true,
    });

    await this.cacheManager.set(status._id, status, EIGHT_HOURS);
  }

  async findAll(): Promise<Status[]> {
    const statusCache: Status[] = await this.cacheManager.get(STATUS);

    if (!statusCache) {
      const status = await this.statusModel.find();

      await this.cacheManager.set(STATUS, status, TEN_SECONDS);

      return status;
    }

    return statusCache;
  }

  async findOne(orderId: string): Promise<Status> {
    const status: Status = await this.statusModel.findOne({ orderId });

    if (!status) {
      throw new NotFoundException(notFound(STATUS));
    }

    return status;
  }

  async update(orderId: string, statusUpdatePayload: IStatusUpdatePayload): Promise<void> {
    const status = await this.statusModel.findOneAndUpdate(
      { orderId, active: true },
      statusUpdatePayload,
      { new: true },
    );

    await this.cacheManager.set(status._id, status, EIGHT_HOURS);
  }

  async remove(orderId: string): Promise<void> {
    const status = await this.statusModel.findOneAndUpdate(
      { orderId, active: true },
      { active: false },
      { new: true },
    );

    await this.cacheManager.del(status._id);
  }
}
