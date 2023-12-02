import { IsNotEmpty, IsNotEmptyObject } from 'class-validator';

export class CreateOrderDto {
  @IsNotEmptyObject()
  readonly customer: { name: string };

  @IsNotEmpty()
  readonly description: string;
}
