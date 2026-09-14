import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterComponent } from './register';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
      imports: [RegisterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
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
  it('rejects weak and mismatched passwords before registration', () => {
    component.form.setValue({
      name: 'Test',
      email: 'test@example.test',
      password: 'weak',
      confirmPassword: 'weak',
    });
    component.register();
    expect(component.error).toContain('Password');
    component.form.patchValue({ password: 'StrongPassword!2026', confirmPassword: 'different' });
    component.register();
    expect(component.error).toContain('do not match');
    TestBed.inject(HttpTestingController).expectNone('/api/auth/register');
  });
});
