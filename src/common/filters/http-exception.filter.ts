import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string | string[];
    let error: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const r = exceptionResponse as Record<string, unknown>;
        // class-validator retourne un tableau de messages dans r.message
        message = (r.message as string | string[]) ?? exception.message;
      } else {
        message = exception.message;
      }

      error = this.statusToError(status);
    } else {
      // Erreur non-HTTP (bug interne, erreur JS non capturée)
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      error = 'Internal Server Error';
      // On ne divulgue pas les détails d'une erreur interne inattendue
      message = 'An unexpected error occurred. Please contact support.';

      // On log l'erreur réelle côté serveur uniquement
      this.logger.error('Unhandled exception', exception instanceof Error ? exception.stack : String(exception));
    }

    const body: ErrorResponse = {
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(body);
  }

  private statusToError(status: number): string {
    const map: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
    };
    return map[status] ?? 'Error';
  }
}
