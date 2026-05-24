import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AxiosError } from 'axios';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('GatewayFilter');

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details: any = undefined;

    // NestJS HTTP exceptions (validation errors, guards, etc.)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message || message;
      details = typeof res === 'object' ? res : undefined;
    }
    // Axios errors from downstream services
    else if (exception?.isAxiosError) {
      const axiosErr = exception as AxiosError;
      status = axiosErr.response?.status || HttpStatus.BAD_GATEWAY;
      const downstream = axiosErr.response?.data as any;
      message = downstream?.message || `Service unavailable`;
      details = downstream;

      this.logger.error(
        `Downstream error: ${axiosErr.config?.url} → ${status} ${message}`,
      );
    } else {
      this.logger.error(`Unhandled error: ${exception?.message}`, exception?.stack);
    }

    response.status(status).json({
      statusCode: status,
      message,
      ...(details && { details }),
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
