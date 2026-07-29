import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { AuthenticationService } from '../../../iam/application/authentication.service';
import { PlatformShellComponent } from './platform-shell.component';

describe('PlatformShellComponent', () => {
  let fixture: ComponentFixture<PlatformShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlatformShellComponent],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: AuthenticationService, useValue: { currentUser: signal(null), signOut: () => undefined } }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(PlatformShellComponent);
    fixture.detectChanges();
  });

  it('renders a skip link, navigation and content outlet', () => {
    expect(fixture.nativeElement.querySelector('.skip-link')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('nav')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
  });
});
