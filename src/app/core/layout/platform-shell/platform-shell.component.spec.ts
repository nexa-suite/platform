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

  it('exposes every authorized internal work area without changing authentication state', () => {
    const auth = TestBed.inject(AuthenticationService) as unknown as { currentUser: ReturnType<typeof signal> };
    auth.currentUser.set({ subject: 'u1', identifier: 'owner@nexa.test', displayName: 'Owner', workspaceSlug: 'icisa', roles: ['COMPANY_OWNER', 'SALES'], permissions: ['sales:read'] });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('select')).toBeTruthy();
  });
});
