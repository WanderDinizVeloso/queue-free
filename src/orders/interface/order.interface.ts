interface IPatchAndDeleteReturn {
  message: string;
}

interface IPostReturn extends IPatchAndDeleteReturn {
  _id: string;
}

export { IPatchAndDeleteReturn, IPostReturn };
