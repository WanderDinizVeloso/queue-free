import { Cache } from 'cache-manager';
import { Model } from 'mongoose';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { InjectModel } from '@nestjs/mongoose';

import { Report, ReportDocument } from './schema/report.schema';
import { notFound } from 'src/utils/messages-response';
import { TEN_SECONDS, EIGHT_HOURS } from 'src/utils/redis-times';

const REPORT = 'report';
const REPORTS = 'reports';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Report.name) private readonly reportModel: Model<ReportDocument>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private dateValidate(date: string): void {
    const passTest = /^\d{4}[-](0[1-9]|1[012])[-](0[1-9]|[12][0-9]|3[01])/g.test(date);

    if (!passTest) {
      throw new BadRequestException('The date must be in the format YYYY-MM-DD');
    }
  }

  async findAll(): Promise<Report[]> {
    const reportsCache: Report[] = await this.cacheManager.get(REPORTS);

    if (!reportsCache) {
      const reports = await this.reportModel.find();

      await this.cacheManager.set(REPORTS, reports, TEN_SECONDS);

      return reports;
    }

    return reportsCache;
  }

  async findByDate(date: string): Promise<Report> {
    this.dateValidate(date);

    const reportCache: Report = await this.cacheManager.get(date);

    if (!reportCache) {
      const report = await this.reportModel.findOne({ date });

      if (!report) {
        throw new NotFoundException(notFound(REPORT));
      }

      await this.cacheManager.set(date, report, EIGHT_HOURS);

      return report;
    }

    return reportCache;
  }
}
