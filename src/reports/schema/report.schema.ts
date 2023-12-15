import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

type ReportDocument = Report & Document;

@Schema({ timestamps: false, versionKey: false })
class Report extends Document {
  @Prop({ required: true, index: true })
  date: string;
}

const ReportSchema = SchemaFactory.createForClass(Report);

export { ReportDocument, Report, ReportSchema };
