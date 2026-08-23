import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { SegmentedControlComponent } from './segmented-control.component';

describe('SegmentedControlComponent', () => {
  let fixture: ComponentFixture<SegmentedControlComponent>;
  let component: SegmentedControlComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SegmentedControlComponent],
    });
    fixture = TestBed.createComponent(SegmentedControlComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('label', 'View Mode');
    fixture.componentRef.setInput('options', [
      { value: 'grid', label: 'Grid' },
      { value: 'list', label: 'List' },
    ]);
    fixture.componentRef.setInput('selected', 'grid');
    fixture.detectChanges();
  });

  it('updates selection on option click', () => {
    expect(component.selected()).toBe('grid');
    component.choose({ value: 'list', label: 'List' });
    expect(component.selected()).toBe('list');
  });
});
