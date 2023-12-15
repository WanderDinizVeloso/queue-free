import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Report } from './schema/report.schema';

const SUMMARY_MESSAGE = {
  findAll: 'Search all reports.',
  findByDate: 'Search for a report by Date.',
};

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({ summary: SUMMARY_MESSAGE.findAll })
  async findAll(): Promise<Report[]> {
    return this.reportsService.findAll();
  }

  @Get('/date')
  @ApiOperation({ summary: SUMMARY_MESSAGE.findByDate })
  async findOne(@Query('date') date: string): Promise<Report> {
    return this.reportsService.findByDate(date);
  }
}
