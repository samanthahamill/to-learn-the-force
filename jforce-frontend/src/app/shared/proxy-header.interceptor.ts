import { HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { backendEnv } from '../../environments/environment';

/**
 * An interceptor to handle http requests that are being set out (not received)
 * @param req - original request to the backend
 * @param next - method to handle request after modification
 * @returns - modified request to the backend
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ProxyHeaderInterceptor(
  req: HttpRequest<any>,
  next: HttpHandlerFn,
): Observable<HttpEvent<any>> {
  const append = ''; //backendEnv.production ? '/jforce' : '';

  const newReq = req.clone({
    url: `${append}/api${req.url}`,
    setHeaders: {
      'X-Requested-With': 'XMLHttpRequest',
    },
  });

  return next(newReq);
}
