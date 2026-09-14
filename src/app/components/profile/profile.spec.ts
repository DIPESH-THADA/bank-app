import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from '../../services/auth.service';
import { ProfileComponent } from './profile';

describe('Profile', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }),
  );
  afterEach(() => {
    const http = TestBed.inject(HttpTestingController);
    http.match('/api/notifications').forEach((request) => request.flush([]));
    http.verify();
  });
  function setup() {
    const auth = TestBed.inject(AuthService),
      http = TestBed.inject(HttpTestingController);
    auth.restoreSession().subscribe();
    http.expectOne('/api/auth/me').flush({
      id: '1',
      name: 'Demo Customer',
      email: 'demo@nexusbank.test',
      phone: '',
      address: '',
      avatar: '',
    });
    return { component: TestBed.createComponent(ProfileComponent).componentInstance, http };
  }
  it('loads the current profile and publishes saved details', () => {
    const { component, http } = setup();
    expect(component.form.controls.name.value).toBe('Demo Customer');
    component.form.controls.name.setValue('Updated Name');
    component.save();
    const request = http.expectOne('/api/profile');
    expect(request.request.method).toBe('PATCH');
    request.flush({ id: '1', ...request.request.body });
    expect(component.user()?.name).toBe('Updated Name');
    expect(component.message()).toContain('saved');
    expect(component.saving()).toBe(false);
  });
  it('requires the current password for email changes and restores cancelled edits', () => {
    const { component, http } = setup();
    component.form.controls.email.setValue('new@example.test');
    component.save();
    expect(component.error()).toContain('current password');
    http.expectNone('/api/profile');
    component.restore();
    expect(component.form.controls.email.value).toBe('demo@nexusbank.test');
  });
  it('rejects invalid photo formats before upload', async () => {
    const { component, http } = setup();
    await component.uploadPhoto({
      target: { files: [new File(['bad'], 'photo.svg', { type: 'image/svg+xml' })], value: '' },
    } as unknown as Event);
    expect(component.error()).toContain('PNG or JPEG');
    expect(component.avatar()).toBe('');
    http.expectNone('/api/profile');
  });
});
