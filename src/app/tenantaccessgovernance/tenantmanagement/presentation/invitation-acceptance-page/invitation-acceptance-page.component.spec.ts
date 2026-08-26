import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InvitationAcceptanceFacade } from '../../application/invitation-acceptance.facade';
import { InvitationAcceptancePageComponent } from './invitation-acceptance-page.component';

describe('InvitationAcceptancePageComponent', () => {
  let fixture: ComponentFixture<InvitationAcceptancePageComponent>;
  const facade = {
    busy: vi.fn(() => false),
    result: vi.fn(() => null),
    error: vi.fn(() => null),
    accept: vi.fn(() => of({ invitationId: 'invitation', userId: 'user', workspaceId: 'workspace', roles: ['SALES'] }))
  };
  const route = { snapshot: { queryParamMap: convertToParamMap({ token: 'opaque-token', keep: 'value' }) } };
  const router = { navigate: vi.fn(() => Promise.resolve(true)) };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [InvitationAcceptancePageComponent],
      providers: [provideTranslateService(), { provide: ActivatedRoute, useValue: route }, { provide: Router, useValue: router }, { provide: InvitationAcceptanceFacade, useValue: facade }]
    }).compileComponents();
    fixture = TestBed.createComponent(InvitationAcceptancePageComponent);
    fixture.detectChanges();
  });

  it('captures and scrubs the public invitation token', () => {
    expect(fixture.componentInstance.form.controls.token.value).toBe('opaque-token');
    expect(router.navigate).toHaveBeenCalledWith([], { relativeTo: route, queryParams: { token: null }, queryParamsHandling: 'merge', replaceUrl: true });
  });

  it('supports the existing-user mode with the backend acceptance payload', () => {
    const component = fixture.componentInstance;
    component.setMode('existing');
    component.form.controls.password.setValue('valid-existing-password');
    component.submit();
    expect(facade.accept).toHaveBeenCalledWith({ token: 'opaque-token', password: 'valid-existing-password', displayName: null });
  });
});
