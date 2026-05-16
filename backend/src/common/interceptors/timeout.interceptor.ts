import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
  RequestTimeoutException,
} from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, tap, timeout } from 'rxjs/operators';

const DEFAULT_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS) || 12_000;
const SLOW_REQUEST_MS = Number(process.env.SLOW_REQUEST_MS) || 1_500;

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Request');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const startedAt = Date.now();
    const tag = `${req.method} ${req.originalUrl || req.url}`;

    return next.handle().pipe(
      timeout(DEFAULT_TIMEOUT_MS),
      tap(() => {
        const elapsed = Date.now() - startedAt;
        if (elapsed >= SLOW_REQUEST_MS) {
          this.logger.warn(`SLOW ${elapsed}ms ${tag}`);
        }
      }),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          const elapsed = Date.now() - startedAt;
          this.logger.error(`TIMEOUT ${elapsed}ms ${tag}`);
          return throwError(
            () => new RequestTimeoutException('Request timed out'),
          );
        }
        return throwError(() => err);
      }),
    );
  }
}
