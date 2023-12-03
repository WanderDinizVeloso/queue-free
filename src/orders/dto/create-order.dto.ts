import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNotEmptyObject } from 'class-validator';

const PROPERTIES_DESCRIPTION = {
  customerName: 'Customer name. Requirements: not empty',
  description: 'Order description. Requirements: not empty',
};

export class CreateOrderDto {
  @ApiProperty({ description: PROPERTIES_DESCRIPTION.customerName })
  @IsNotEmptyObject()
  readonly customerName: string;

  @ApiProperty({ description: PROPERTIES_DESCRIPTION.description })
  @IsNotEmpty()
  readonly description: string;
}
