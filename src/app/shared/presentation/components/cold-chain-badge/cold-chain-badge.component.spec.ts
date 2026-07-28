import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ColdChainBadgeComponent } from './cold-chain-badge.component';

describe('ColdChainBadgeComponent', () => {
  let fixture: ComponentFixture<ColdChainBadgeComponent>;
  beforeEach(async () => { await TestBed.configureTestingModule({ imports: [ColdChainBadgeComponent] }).compileComponents(); fixture = TestBed.createComponent(ColdChainBadgeComponent); fixture.componentRef.setInput('label', 'Refrigerated'); fixture.detectChanges(); });
  it('renders a visual cold-chain label without inferring it', () => { expect(fixture.nativeElement.textContent).toContain('Refrigerated'); });
});
