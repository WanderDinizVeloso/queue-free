interface IQueueMessagePayload {
  orderId: string;
  ticketId: string;
  ticketNumber: number;
}

interface IOrderResponse {
  _id: string;
  customerName: string;
  description: string;
}

interface IQueueTicketResponse {
  ticketNumber: number;
  ticketId: string;
  order: IOrderResponse;
}

export { IQueueMessagePayload, IQueueTicketResponse };
