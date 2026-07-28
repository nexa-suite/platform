import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PageHeaderComponent } from './page-header.component';

describe('PageHeaderComponent', () => {
  let fixture: ComponentFixture<PageHeaderComponent>;
  beforeEach(async () => { await TestBed.configureTestingModule({ imports: [PageHeaderComponent] }).compileComponents(); fixture = TestBed.createComponent(PageHeaderComponent); fixture.componentRef.setInput('title', 'Title'); fixture.detectChanges(); });
  it('renders a heading', () => { expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Title'); });
});
