import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MetricCardComponent } from './metric-card.component';

describe('MetricCardComponent', () => {
  let fixture: ComponentFixture<MetricCardComponent>;
  beforeEach(async () => { await TestBed.configureTestingModule({ imports: [MetricCardComponent] }).compileComponents(); fixture = TestBed.createComponent(MetricCardComponent); fixture.componentRef.setInput('label', 'Count'); fixture.componentRef.setInput('value', 5); fixture.detectChanges(); });
  it('renders supplied presentation values without querying data', () => { expect(fixture.nativeElement.textContent).toContain('Count'); expect(fixture.nativeElement.textContent).toContain('5'); });
});
