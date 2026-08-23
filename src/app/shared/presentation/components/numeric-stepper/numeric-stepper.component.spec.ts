import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { NumericStepperComponent } from './numeric-stepper.component';

describe('NumericStepperComponent', () => {
  let fixture: ComponentFixture<NumericStepperComponent>;
  let component: NumericStepperComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NumericStepperComponent],
    });
    fixture = TestBed.createComponent(NumericStepperComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('id', 'test-stepper');
    fixture.componentRef.setInput('label', 'Quantity');
    fixture.detectChanges();
  });

  it('increments and decrements within bounds', () => {
    expect(component.value()).toBe(1);
    component.increment();
    expect(component.value()).toBe(2);
    component.decrement();
    expect(component.value()).toBe(1);
  });
});
