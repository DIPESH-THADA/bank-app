import { TestBed } from '@angular/core/testing';
import {
  provideRouter,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Observable } from 'rxjs';
import { authGuard } from './auth.guard';
describe('private routes', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }),
  );
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it('redirects anonymous visitors and preserves the destination', () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/transfer' } as RouterStateSnapshot),
    ) as Observable<unknown>;
    result.subscribe((value) =>
      expect(TestBed.inject(Router).serializeUrl(value as never)).toBe(
        '/login?returnUrl=%2Ftransfer',
      ),
    );
    TestBed.inject(HttpTestingController)
      .expectOne('/api/auth/me')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
  });
  it('allows a valid server session after refresh', () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/dashboard' } as RouterStateSnapshot),
    ) as Observable<unknown>;
    result.subscribe((value) => expect(value).toBe(true));
    TestBed.inject(HttpTestingController)
      .expectOne('/api/auth/me')
      .flush({ id: '1', name: 'Demo', email: 'demo@nexusbank.test' });
  });
});
