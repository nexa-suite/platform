import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';
import { PlatformAuthenticationBoundary } from '../../security/platform-authentication.boundary';
import { PlatformNotificationsService } from '../../../notifications/application/platform-notifications.service';
import { PlatformShellComponent } from './platform-shell.component';

describe('PlatformShellComponent', () => {
  let fixture: ComponentFixture<PlatformShellComponent>;
  const breakpointState = new BehaviorSubject({ matches: false, breakpoints: {} });

  beforeEach(async () => {
    breakpointState.next({ matches: false, breakpoints: {} });
    await TestBed.configureTestingModule({
      imports: [PlatformShellComponent],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: BreakpointObserver, useValue: { observe: () => breakpointState } },
        { provide: PlatformAuthenticationBoundary, useValue: { currentUser: signal(null), hasPermission: vi.fn(), signOut: () => undefined } },
        { provide: PlatformNotificationsService, useValue: { notifications: signal([]), unreadCount: signal(0), markAllRead: vi.fn(), markRead: vi.fn() } }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(PlatformShellComponent);
    fixture.detectChanges();
  });

  it('renders semantic shell landmarks and keyboard bypass', () => {
    expect(fixture.nativeElement.querySelector('.skip-link')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.platform-navigation')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.platform-toolbar')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('main#main-content[tabindex="-1"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
  });

  it('exposes an accessible mobile drawer without changing navigation contracts', () => {
    breakpointState.next({ matches: true, breakpoints: { '(max-width: 860px)': true } });
    fixture.detectChanges();

    fixture.componentInstance.toggleMobileNavigation();
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('.mobile-menu-button') as HTMLButtonElement;
    const drawer = fixture.nativeElement.querySelector('.platform-sidebar') as HTMLElement;
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(drawer.getAttribute('role')).toBe('dialog');
    expect(fixture.componentInstance.navigation().map((item) => item.path)).toEqual([]);

    fixture.componentInstance.closeOpenLayer();
    expect(fixture.componentInstance.mobileNavOpen()).toBe(false);
    breakpointState.next({ matches: false, breakpoints: {} });
  });

  it('renders notifications as keyboard-operable controls', () => {
    const notifications = TestBed.inject(PlatformNotificationsService) as unknown as {
      notifications: ReturnType<typeof signal>;
      unreadCount: ReturnType<typeof signal>;
    };
    notifications.notifications.set([{
      id: 'notification-1',
      title: 'Pedido listo',
      message: 'La orden puede avanzar.',
      createdAt: '2026-08-19T12:00:00Z',
      read: false,
      deepLink: '/ops/commercial/sales-orders'
    }]);
    notifications.unreadCount.set(1);

    fixture.componentInstance.toggleNotifications();
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('[aria-controls="platform-notification-panel"]') as HTMLButtonElement;
    const panel = fixture.nativeElement.querySelector('#platform-notification-panel') as HTMLElement;
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(panel.getAttribute('role')).toBe('region');
    expect(panel.querySelector('button.notification-item')).toBeTruthy();
    expect(panel.querySelector('a[href="/ops/commercial/sales-orders"]')).toBeTruthy();

    fixture.componentInstance.closeOpenLayer();
    expect(fixture.componentInstance.notificationsOpen()).toBe(false);
  });

  it('exposes every authorized internal work area without changing authentication state', () => {
    const auth = TestBed.inject(PlatformAuthenticationBoundary) as unknown as { currentUser: ReturnType<typeof signal> };
    auth.currentUser.set({ subject: 'u1', identifier: 'owner@nexa.test', displayName: 'Owner', workspaceSlug: 'icisa', roles: ['COMPANY_OWNER', 'SALES'], permissions: ['sales:read'] });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('select')).toBeTruthy();
  });

  it('uses backend permissions as the navigation authority instead of role labels', () => {
    const auth = TestBed.inject(PlatformAuthenticationBoundary) as unknown as {
      currentUser: ReturnType<typeof signal>;
      hasPermission: ReturnType<typeof vi.fn>;
    };
    auth.currentUser.set({ subject: 'u1', identifier: 'tenant@nexa.test', displayName: 'Tenant', workspaceSlug: 'icisa', roles: ['TENANT_ADMIN'], permissions: ['catalog:read'] });
    auth.hasPermission.mockImplementation((permission: string) => permission === 'catalog:read');
    fixture.detectChanges();

    expect(fixture.componentInstance.navigation().map((item) => item.path)).toEqual(['/ops/catalog']);
    expect(fixture.componentInstance.availableAreas().map((area) => area.path)).toEqual(['/ops/catalog']);
  });

  it('offers a permission-backed area for a tenant-defined role', () => {
    const auth = TestBed.inject(PlatformAuthenticationBoundary) as unknown as {
      currentUser: ReturnType<typeof signal>;
      hasPermission: ReturnType<typeof vi.fn>;
    };
    auth.currentUser.set({ subject: 'u1', identifier: 'custom@nexa.test', displayName: 'Custom', workspaceSlug: 'icisa', roles: [], roleCodes: ['CUSTOM_SALES'], permissions: ['sales:read'] });
    auth.hasPermission.mockImplementation((permission: string) => permission === 'sales:read');
    fixture.detectChanges();

    expect(fixture.componentInstance.availableAreas().map((area) => area.path)).toEqual(['/ops/commercial/dashboard']);
  });
});
