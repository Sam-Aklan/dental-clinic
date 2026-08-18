import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Envelope<T> {
  statusCode: number;
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Envelope<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Envelope<T>> {
    const response = context.switchToHttp().getResponse();
    return next.handle().pipe(
      map((data) => {
        if (
          data &&
          typeof data === 'object' &&
          'statusCode' in data &&
          'data' in data
        ) {
          return data;
        }
        return {
          statusCode: response.statusCode,
          data,
        };
      }),
    );
  }
}
