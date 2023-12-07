import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

type TicketDocument = Ticket & Document;

@Schema({ timestamps: true, versionKey: false })
class Ticket extends Document {
  @Prop()
  ticketNumber: string;

  @Prop()
  orderId: string;

  @Prop()
  active: boolean;
}

const TicketSchema = SchemaFactory.createForClass(Ticket);

export { TicketDocument, Ticket, TicketSchema };
