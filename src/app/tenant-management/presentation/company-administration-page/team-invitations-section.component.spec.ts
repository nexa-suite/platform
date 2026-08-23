import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CompanyAdministrationFacade } from '../../application/company-administration.facade';
import { INITIAL_TENANT_ADMINISTRATION_STATE, WorkspaceMembershipSummary } from '../../domain/models/company-administration.models';
import { TeamInvitationsSectionComponent } from './team-invitations-section.component';

const member: WorkspaceMembershipSummary = { id: 'member', workspaceId: 'workspace', userId: 'user', email: 'member@example.com', displayName: 'Member', status: 'ACTIVE', version: 4, roles: ['SALES'] };

describe('TeamInvitationsSectionComponent', () => {
  let fixture: ComponentFixture<TeamInvitationsSectionComponent>;
  const state = signal({ ...INITIAL_TENANT_ADMINISTRATION_STATE, memberships: [member] });
  const facade = {
    state: state.asReadonly(),
    canManage: signal(true).asReadonly(),
    canInviteMembers: signal(true).asReadonly(),
    canManageMembers: signal(true).asReadonly(),
    canAssignRoles: signal(true).asReadonly(),
    busy: signal(false).asReadonly(),
    changeRoles: vi.fn(),
    loadMembershipDetail: vi.fn(),
    clearMembershipDetail: vi.fn(),
    createInvitation: vi.fn(),
    resendInvitation: vi.fn(),
    revokeInvitation: vi.fn(),
    suspend: vi.fn(),
    reactivate: vi.fn()
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({ imports: [TeamInvitationsSectionComponent], providers: [provideTranslateService(), { provide: CompanyAdministrationFacade, useValue: facade }] }).compileComponents();
    fixture = TestBed.createComponent(TeamInvitationsSectionComponent);
    fixture.detectChanges();
  });

  it('requires deliberate confirmation before sending role changes with the member version', () => {
    const component = fixture.componentInstance;
    component.requestRoleChange(member, ['WAREHOUSE']);
    expect(facade.changeRoles).not.toHaveBeenCalled();
    expect(component.pendingRoleChange()?.roles).toEqual(['WAREHOUSE']);
    component.confirmRoleChange();
    expect(facade.changeRoles).toHaveBeenCalledWith('member', 4, ['WAREHOUSE']);
  });

  it('loads and closes a member detail view', () => {
    const component = fixture.componentInstance;
    component.openMemberDetail(member);
    component.closeMemberDetail();
    expect(facade.loadMembershipDetail).toHaveBeenCalledWith('member');
    expect(facade.clearMembershipDetail).toHaveBeenCalledTimes(1);
  });

  it('requires deliberate confirmation before changing membership status with the member version', () => {
    const component = fixture.componentInstance;
    component.toggleMembership(member);
    expect(facade.suspend).not.toHaveBeenCalled();
    expect(component.pendingMembershipLifecycle()?.action).toBe('suspend');
    component.confirmMembershipLifecycle();
    expect(facade.suspend).toHaveBeenCalledWith('member', 4);
  });

  it('does not offer Company Owner as an additional assignable role', () => {
    const component = fixture.componentInstance;
    expect(component.fixedRoles).not.toContain('COMPANY_OWNER');
    expect(component.assignableRoles().map((role) => role.value)).not.toContain('COMPANY_OWNER');
  });

  it('blocks removing the only active Company Owner before issuing a mutation', () => {
    const owner: WorkspaceMembershipSummary = { ...member, id: 'owner', roles: ['COMPANY_OWNER'] };
    state.set({ ...state(), memberships: [owner] });
    const component = fixture.componentInstance;

    component.requestRoleChange(owner, ['SALES']);

    expect(facade.changeRoles).not.toHaveBeenCalled();
    expect(component.ownerRoleError()).toBe('LAST_ACTIVE_OWNER_REQUIRED');
  });
});
