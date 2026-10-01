import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiErrorResponse } from '../interfaces/api-response.interface';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let errorMessage = 'An unexpected error occurred';
    let details: unknown = undefined;

    try {
      const isHttpException =
        exception instanceof HttpException ||
        (typeof exception === 'object' &&
          exception !== null &&
          typeof (exception as any).getStatus === 'function' &&
          typeof (exception as any).getResponse === 'function');

      if (isHttpException) {
        const httpEx = exception as HttpException;
        status = httpEx.getStatus();
        const res = httpEx.getResponse();

        if (typeof res === 'string') {
          errorMessage = res;
          errorCode = this.statusToCode(status);
        } else if (typeof res === 'object' && res !== null) {
          const errorObj = res as Record<string, unknown>;
          errorMessage = (errorObj.message as string) || (httpEx.message as string);
          errorCode =
            (errorObj.code as string) ||
            (errorObj.error as string) ||
            this.statusToCode(status);
          if (Array.isArray(errorObj.message)) {
            errorMessage = errorObj.message.join(', ');
            details = errorObj.message;
          }
        }
      } else if (exception instanceof Error) {
        this.logger.error(`Unhandled Exception: ${exception.message}`, exception.stack);
        // Mask internal errors to prevent leaking database or server details
        errorCode = 'INTERNAL_SERVER_ERROR';
        errorMessage = 'Internal server error';
      } else {
        this.logger.error('Unhandled unknown exception', String(exception));
        errorCode = 'UNKNOWN_ERROR';
        errorMessage = 'An unexpected error occurred';
      }

      const safeErrorCode = String(errorCode || 'INTERNAL_SERVER_ERROR')
        .toUpperCase()
        .replace(/\s+/g, '_');

      const errorPayload: ApiErrorResponse = {
        success: false,
        error: {
          code: safeErrorCode,
          message: errorMessage,
          ...(details ? { details } : {}),
        },
      };

      response.status(status).json(errorPayload);
    } catch (filterError) {
      this.logger.error('Error in AllExceptionsFilter', filterError);
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
        },
      });
    }
  }

  private statusToCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'UNPROCESSABLE_ENTITY';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'TOO_MANY_REQUESTS';
      default:
        return 'INTERNAL_SERVER_ERROR';
    }
  }
}
