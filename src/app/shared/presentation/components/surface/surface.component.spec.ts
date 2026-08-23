import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { SurfaceComponent } from './surface.component';

describe('SurfaceComponent', () => {
  let fixture: ComponentFixture<SurfaceComponent>;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SurfaceComponent] });
    fixture = TestBed.createComponent(SurfaceComponent);
    fixture.detectChanges();
  });
  it('renders surface element', () => {
    expect(fixture.nativeElement.querySelector('.nexa-surface')).toBeTruthy();
  });
});
