import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { StatusService } from './status.service';
import { Status } from './schema/status.schema';

const SUMMARY_MESSAGE = {
  findAll: 'Search all status.',
};

@ApiTags('Status')
@Controller('status')
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Get()
  @ApiOperation({ summary: SUMMARY_MESSAGE.findAll })
  findAll(): Promise<Status[]> {
    return this.statusService.findAll();
  }
}
