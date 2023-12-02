import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document } from 'mongoose';

type OrderDocument = Order & Document;

@Schema({ timestamps: true, versionKey: false })
class Order extends Document {
  @Prop(raw({ name: { type: String } }))
  customer: Record<string, string>;

  @Prop()
  description: string;

  @Prop(raw({ preparer: { name: { type: String } } }))
  preparer: Record<string, string>;

  @Prop(
    raw({
      ticketCreated: { type: Date },
      preparationStarted: { type: Date },
      preparationFinished: { type: Date },
      customerReceived: { type: Date },
    }),
  )
  status: Record<string, Date>;

  @Prop()
  active: boolean;
}

const OrderSchema = SchemaFactory.createForClass(Order);

export { OrderDocument, Order, OrderSchema };
