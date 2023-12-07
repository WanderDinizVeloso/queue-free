interface IPatchAndDeleteReturn {
  message: string;
}

interface ITicketReturn {
  _id: string;
  ticketNumber: number;
}

interface IPostReturn extends IPatchAndDeleteReturn {
  _id: string;
  ticket: ITicketReturn;
}

export { IPatchAndDeleteReturn, IPostReturn };
