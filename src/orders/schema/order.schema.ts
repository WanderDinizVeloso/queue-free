import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

type OrderDocument = Order & Document;

@Schema({ timestamps: true, versionKey: false })
class Order extends Document {
  @Prop()
  customerName: string;

  @Prop()
  description: string;

  @Prop()
  active: boolean;
}

const OrderSchema = SchemaFactory.createForClass(Order);

export { OrderDocument, Order, OrderSchema };
