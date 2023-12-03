import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { IError } from './interface/common-interceptors.interface';

export const MESSAGES = {
  invalidId: 'id is an invalid MongoDB ObjectId.',
};

@Injectable()
export class InvalidIdInterceptor implements NestInterceptor {
  private isInvalidId(error: IError): boolean {
    return error.kind === 'ObjectId' && error.path === '_id';
  }

  private errorResponse(error: IError): Observable<void> {
    return this.isInvalidId(error)
      ? throwError(() => new BadRequestException(MESSAGES.invalidId))
      : throwError(() => error);
  }

  intercept(_context: ExecutionContext, next: CallHandler): Observable<void> {
    return next.handle().pipe(catchError((error) => this.errorResponse(error)));
  }
}
