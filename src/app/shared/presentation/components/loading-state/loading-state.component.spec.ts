import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadingStateComponent } from './loading-state.component';

describe('LoadingStateComponent', () => {
  let fixture: ComponentFixture<LoadingStateComponent>;
  beforeEach(async () => { await TestBed.configureTestingModule({ imports: [LoadingStateComponent] }).compileComponents(); fixture = TestBed.createComponent(LoadingStateComponent); fixture.detectChanges(); });
  it('exposes busy state and accessible label', () => { const node = fixture.nativeElement.querySelector('.loading-state'); expect(node.getAttribute('aria-busy')).toBe('true'); expect(node.getAttribute('aria-label')).toBe('Loading'); });
});
