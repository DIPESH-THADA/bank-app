import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginComponent } from './login';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
      imports: [LoginComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    TestBed.inject(HttpTestingController)
      .match(() => true)
      .forEach((request) => request.flush([]));
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('rejects an invalid form without sending credentials', () => {
    component.form.setValue({ email: 'invalid', password: '' });
    component.login();
    expect(component.error).toContain('valid email');
    TestBed.inject(HttpTestingController).expectNone('/api/auth/login');
  });
  it('renders a failed login and releases the submit button', async () => {
    component.form.setValue({ email: 'demo@nexusbank.test', password: 'wrong' });
    component.login();
    TestBed.inject(HttpTestingController)
      .expectOne('/api/auth/login')
      .flush(
        { message: 'Invalid email or password.' },
        { status: 401, statusText: 'Unauthorized' },
      );
    await fixture.whenStable();
    expect(component.loading).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Invalid email or password.');
  });
});
