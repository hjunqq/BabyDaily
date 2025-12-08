import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCodes } from '../enums/error-codes.enum';
import { MulterError } from 'multer';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message: string | string[] = 'Internal server error';
        let error = 'Internal Server Error';
        let code = ErrorCodes.GENERIC_ERROR;

        if (exception instanceof MulterError) {
            status = HttpStatus.BAD_REQUEST;
            if (exception.code === 'LIMIT_FILE_SIZE') {
                message = 'File too large';
                error = 'Bad Request';
                code = ErrorCodes.UPLOAD_TOO_LARGE;
            } else {
                message = exception.message;
                error = exception.name;
                code = ErrorCodes.UPLOAD_INVALID_TYPE;
            }
        } else if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'object') {
                message = (exceptionResponse as any).message || message;
                error = (exceptionResponse as any).error || error;
                code = (exceptionResponse as any).code || code;
            } else {
                message = exceptionResponse;
            }
        } else if (exception instanceof Error) {
            message = exception.message;
            error = exception.name;
        }

        // 记录错误日志
        this.logger.error(
            `${request.method} ${request.url}`,
            exception instanceof Error ? exception.stack : `${exception}`,
        );

        // 返回统一的错误响应
        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            message,
            error,
            code,
        });
    }
}
