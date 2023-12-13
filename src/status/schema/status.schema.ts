import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

type StatusDocument = Status & Document;

@Schema({ timestamps: true, versionKey: false })
class Status extends Document {
  @Prop({ unique: true })
  orderId: string;

  @Prop()
  ticketId: string;

  @Prop()
  orderCreatedAt: Date;

  @Prop()
  ticketCreatedAt: Date;

  @Prop()
  sendQueueMessageAt: Date;

  @Prop()
  receivedQueueMessageAt: Date;

  @Prop()
  manufacturingStartedAt: Date;

  @Prop()
  manufacturingFinishedAt: Date;

  @Prop()
  customerReceivedAt: Date;

  @Prop()
  active: boolean;
}

const StatusSchema = SchemaFactory.createForClass(Status);

export { StatusDocument, Status, StatusSchema };
