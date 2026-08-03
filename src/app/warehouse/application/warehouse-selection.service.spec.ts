import { TestBed } from '@angular/core/testing';
import { WarehouseSelectionService } from './warehouse-selection.service';

describe('WarehouseSelectionService', () => {
  it('keeps the selected warehouse as a session-scoped context', () => {
    TestBed.configureTestingModule({ providers: [WarehouseSelectionService] });
    const service = TestBed.inject(WarehouseSelectionService);
    expect(service.selectedId()).toBeNull();
    service.select('warehouse-1');
    expect(service.selectedId()).toBe('warehouse-1');
    service.clear();
    expect(service.selectedId()).toBeNull();
  });
});
