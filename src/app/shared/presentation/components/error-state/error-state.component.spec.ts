import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ErrorStateComponent } from './error-state.component';

describe('ErrorStateComponent', () => {
  let fixture: ComponentFixture<ErrorStateComponent>;
  beforeEach(async () => { await TestBed.configureTestingModule({ imports: [ErrorStateComponent] }).compileComponents(); fixture = TestBed.createComponent(ErrorStateComponent); fixture.componentRef.setInput('title', 'Unable to load'); fixture.detectChanges(); });
  it('emits retry once per activation', () => { let calls = 0; fixture.componentInstance.retry.subscribe(() => calls++); const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement; button.click(); button.click(); expect(calls).toBe(1); });
});
