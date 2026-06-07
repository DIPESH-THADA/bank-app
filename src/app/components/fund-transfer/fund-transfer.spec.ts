import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FundTransfer } from './fund-transfer';

describe('FundTransfer', () => {
  let component: FundTransfer;
  let fixture: ComponentFixture<FundTransfer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundTransfer],
    }).compileComponents();

    fixture = TestBed.createComponent(FundTransfer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
