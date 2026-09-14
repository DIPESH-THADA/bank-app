import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FundTransferComponent } from './fund-transfer';

describe('FundTransferComponent', () => {
  let component: FundTransferComponent;
  let fixture: ComponentFixture<FundTransferComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
      imports: [FundTransferComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FundTransferComponent);
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
  it('requires confirmation and rejects insufficient funds and fractional cents', () => {
    component.accounts = [
      { id: 'a1', accountNumber: '1234', type: 'Checking', balance: 50, currency: 'USD' },
    ];
    component.beneficiaries = [{ id: 'b1', name: 'Alex', accountNumber: '5678', bank: 'Demo' }];
    component.form.setValue({ fromAccount: 'a1', toAccount: 'b1', amount: 51, description: '' });
    component.review();
    expect(component.confirming).toBe(false);
    expect(component.error).toContain('Insufficient');
    component.form.controls.amount.setValue(1.001);
    component.review();
    expect(component.confirming).toBe(false);
    component.transfer();
    TestBed.inject(HttpTestingController).expectNone('/api/transfers');
    component.form.controls.amount.setValue(10);
    component.review();
    expect(component.confirming).toBe(true);
  });
});
