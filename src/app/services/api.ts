import { HttpInterceptorFn } from '@angular/common/http';
export const apiInterceptor: HttpInterceptorFn = (request, next) =>
  next(
    request.url.startsWith('/api/')
      ? request.clone({ setHeaders: { 'X-Nexus-Request': '1' } })
      : request,
  );
export function apiError(error: unknown): string {
  const response = error as { error?: { message?: string } };
  return response?.error?.message || 'Unable to connect. Start the demo API and try again.';
}
