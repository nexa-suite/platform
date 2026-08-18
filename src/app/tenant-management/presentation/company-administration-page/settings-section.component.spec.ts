import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CompanyAdministrationFacade } from '../../application/company-administration.facade';
import { INITIAL_TENANT_ADMINISTRATION_STATE } from '../../domain/models/company-administration.models';
import { SettingsSectionComponent } from './settings-section.component';

describe('SettingsSectionComponent', () => {
  let fixture: ComponentFixture<SettingsSectionComponent>;
  const state = signal({
    ...INITIAL_TENANT_ADMINISTRATION_STATE,
    workspaceSettings: { workspaceId: 'workspace', defaultWorkspaceBehavior: 'STANDARD', warehousePreferenceStrategy: 'PREFERRED', version: 3 },
    operational: { workspaceId: 'workspace', defaultWarehouseSelectionPolicy: 'PREFERRED', orderCutoffPolicy: 'WORKSPACE_HOURS', fulfillmentDefaults: 'STANDARD', inventoryVisibilityPolicy: 'COARSE', buyerAvailabilityPolicy: 'AVAILABLE_ONLY', operatingHoursStart: '08:00:00', operatingHoursEnd: '18:00:00', orderCutoffMinutes: 120, thermalLogRequired: false, version: 5 }
  });
  const facade = {
    state: state.asReadonly(),
    canManage: signal(true).asReadonly(),
    canManageOrganization: signal(true).asReadonly(),
    canManageWorkspace: signal(true).asReadonly(),
    canManageNotifications: signal(true).asReadonly(),
    canManageSecurity: signal(true).asReadonly(),
    busy: signal(false).asReadonly(),
    updateWorkspaceSettings: vi.fn()
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({ imports: [SettingsSectionComponent], providers: [provideTranslateService(), { provide: CompanyAdministrationFacade, useValue: facade }] }).compileComponents();
    fixture = TestBed.createComponent(SettingsSectionComponent);
    fixture.detectChanges();
  });

  it('keeps warehouse strategy under operational settings when saving workspace defaults', () => {
    fixture.componentInstance.workspaceSettingsForm.setValue({ defaultWorkspaceBehavior: 'COMPACT' });
    fixture.componentInstance.saveWorkspaceSettings();
    expect(facade.updateWorkspaceSettings).toHaveBeenCalledWith({ defaultWorkspaceBehavior: 'COMPACT', warehousePreferenceStrategy: 'PREFERRED' }, 3);
  });
});
