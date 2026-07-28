import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SectionPanelComponent } from './section-panel.component';

describe('SectionPanelComponent', () => {
  let fixture: ComponentFixture<SectionPanelComponent>;
  beforeEach(async () => { await TestBed.configureTestingModule({ imports: [SectionPanelComponent] }).compileComponents(); fixture = TestBed.createComponent(SectionPanelComponent); fixture.componentRef.setInput('title', 'Panel'); fixture.detectChanges(); });
  it('renders a semantic section', () => { expect(fixture.nativeElement.querySelector('section')).toBeTruthy(); expect(fixture.nativeElement.textContent).toContain('Panel'); });
});
