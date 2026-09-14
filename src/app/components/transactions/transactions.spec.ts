import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionsComponent } from './transactions';

describe('TransactionsComponent', () => {
  let component: TransactionsComponent;
  let fixture: ComponentFixture<TransactionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
      imports: [TransactionsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionsComponent);
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
  it('combines status, amount, date and search filters and resets pagination', () => {
    component.transactions = [
      {
        id: '1',
        date: new Date('2026-09-01T12:00:00'),
        description: 'Coffee',
        amount: 5,
        type: 'debit',
        category: 'Food',
        status: 'completed',
      },
      {
        id: '2',
        date: new Date('2026-09-02T12:00:00'),
        description: 'Coffee',
        amount: 50,
        type: 'debit',
        category: 'Food',
        status: 'pending',
      },
    ];
    component.searchQuery = 'coffee';
    component.selectedStatus = 'completed';
    component.minAmount = 1;
    component.maxAmount = 10;
    component.dateTo = '2026-09-01';
    component.page = 4;
    component.applyFilters();
    expect(component.filteredTransactions.map((t) => t.id)).toEqual(['1']);
    expect(component.page).toBe(1);
    component.clearFilters();
    expect(component.filteredTransactions.length).toBe(2);
    expect(component.hasActiveFilters).toBe(false);
  });
});
