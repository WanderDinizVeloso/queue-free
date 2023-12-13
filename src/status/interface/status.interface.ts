interface IStatusPayload {
  ticketId: string;
  ticketCreatedAt: Date;
  sendQueueMessageAt: Date;
  receivedQueueMessageAt: Date;
  manufacturingStartedAt: Date;
  manufacturingFinishedAt: Date;
  customerReceivedAt: Date;
}

interface IStatusUpdatePayload extends Partial<IStatusPayload> {}

export { IStatusUpdatePayload };
