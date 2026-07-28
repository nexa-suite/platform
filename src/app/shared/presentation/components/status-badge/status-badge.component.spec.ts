import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusBadgeComponent } from './status-badge.component';

describe('StatusBadgeComponent', () => {
  let fixture: ComponentFixture<StatusBadgeComponent>;
  beforeEach(async () => { await TestBed.configureTestingModule({ imports: [StatusBadgeComponent] }).compileComponents(); fixture = TestBed.createComponent(StatusBadgeComponent); fixture.componentRef.setInput('label', 'Active'); fixture.detectChanges(); });
  it('renders the provided label', () => { expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('Active'); });
});
