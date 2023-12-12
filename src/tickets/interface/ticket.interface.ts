interface IQueueMessagePayload {
  orderId: string;
  ticketNumber: number;
}

interface IOrderResponse {
  _id: string;
  customerName: string;
  description: string;
}

interface IQueueTicketResponse {
  ticketNumber: number;
  order: IOrderResponse;
}

export { IQueueMessagePayload, IQueueTicketResponse };
