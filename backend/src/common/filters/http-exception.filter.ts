import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message: string | string[];
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const resp = exceptionResponse as Record<string, unknown>;
      message = Array.isArray(resp['message']) ? resp['message'] as string[] : (resp['message'] as string) || exception.message;
    } else {
      message = exception.message;
    }

    const errorName = HttpStatus[status]
      ? HttpStatus[status]
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
      : 'Internal Server Error';

    response.status(status).json({
      statusCode: status,
      message,
      error: errorName,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
