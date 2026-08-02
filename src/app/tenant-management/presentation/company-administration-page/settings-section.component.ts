import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CompanyAdministrationFacade } from '../../application/company-administration.facade';
import { CustomFieldDefinition, NotificationPreference } from '../../domain/models/company-administration.models';
import { TenantAdministrationI18n } from '../i18n/tenant-administration-i18n.service';

@Component({
  selector: 'nexa-tenant-settings-section',
  imports: [MatButtonModule, MatCardModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatSelectModule, ReactiveFormsModule],
  templateUrl: './settings-section.component.html',
  styleUrl: './settings-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsSectionComponent {
  readonly facade = inject(CompanyAdministrationFacade);
  readonly i18n = inject(TenantAdministrationI18n);
  private readonly fb = inject(FormBuilder).nonNullable;
  readonly regionalForm = this.fb.group({ timezone: ['UTC', Validators.required], language: ['en', Validators.required], currency: ['USD', [Validators.required, Validators.pattern(/^[A-Z]{3}$/)]], countryRegion: ['PE', Validators.required], dateTimePolicy: ['LOCALE', Validators.required], locale: ['en-US', Validators.required] });
  readonly unitsForm = this.fb.group({ massUnit: ['KG', Validators.required], temperatureUnit: ['CELSIUS', Validators.required], distanceUnit: ['KM', Validators.required], volumeUnit: ['M3', Validators.required] });
  readonly workspaceSettingsForm = this.fb.group({ defaultWorkspaceBehavior: ['STANDARD', Validators.required], warehousePreferenceStrategy: ['MANUAL', Validators.required] });
  readonly operationalForm = this.fb.group({ defaultWarehouseSelectionPolicy: ['MANUAL', Validators.required], orderCutoffPolicy: ['WORKSPACE_HOURS', Validators.required], fulfillmentDefaults: ['STANDARD', Validators.required], inventoryVisibilityPolicy: ['COARSE', Validators.required], buyerAvailabilityPolicy: ['AVAILABLE_ONLY', Validators.required], operatingHoursStart: ['08:00', Validators.required], operatingHoursEnd: ['18:00', Validators.required], orderCutoffMinutes: [120, [Validators.required, Validators.min(0), Validators.max(1440)]], thermalLogRequired: [false] });
  readonly securityForm = this.fb.group({ passwordMinLength: [12, [Validators.required, Validators.min(12), Validators.max(128)]], sessionDurationMinutes: [480, [Validators.required, Validators.min(30), Validators.max(1440)]], invitationExpirationHours: [72, [Validators.required, Validators.min(1), Validators.max(168)]], requiredEmailDomain: [''] });
  readonly customFieldForm = this.fb.group({ fieldKey: ['', [Validators.required, Validators.pattern(/^[a-z][a-z0-9_-]{2,63}$/)]], label: ['', [Validators.required, Validators.maxLength(160)]], fieldKind: ['TEXT', Validators.required], scope: ['CLIENT_ACCOUNT', Validators.required], required: [false], uniqueValue: [false], displayOrder: [0, [Validators.min(0), Validators.max(10000)]], active: [true] });
  readonly customFieldEditForm = this.fb.group({ fieldKey: ['', [Validators.required, Validators.pattern(/^[a-z][a-z0-9_-]{2,63}$/)]], label: ['', [Validators.required, Validators.maxLength(160)]], fieldKind: ['TEXT', Validators.required], scope: ['CLIENT_ACCOUNT', Validators.required], required: [false], uniqueValue: [false], displayOrder: [0, [Validators.min(0), Validators.max(10000)]], active: [true] });
  editingCustomFieldId: string | null = null;
  private regionalVersion = -1;
  private unitsVersion = -1;
  private workspaceSettingsVersion = -1;
  private workspaceSettingsWorkspaceId: string | null = null;
  private operationalVersion = -1;
  private operationalWorkspaceId: string | null = null;
  private securityVersion = -1;
  private notificationVersion = -1;
  private notificationWorkspaceId: string | null = null;

  constructor() {
    effect(() => {
      const state = this.facade.state();
      if (state.regional && state.regional.version !== this.regionalVersion) { this.regionalVersion = state.regional.version; this.regionalForm.reset(state.regional); }
      if (state.units && state.units.version !== this.unitsVersion) { this.unitsVersion = state.units.version; this.unitsForm.reset(state.units); }
      if (state.workspaceSettings && (state.workspaceSettings.version !== this.workspaceSettingsVersion || state.workspaceSettings.workspaceId !== this.workspaceSettingsWorkspaceId)) { this.workspaceSettingsVersion = state.workspaceSettings.version; this.workspaceSettingsWorkspaceId = state.workspaceSettings.workspaceId; this.workspaceSettingsForm.reset({ defaultWorkspaceBehavior: state.workspaceSettings.defaultWorkspaceBehavior, warehousePreferenceStrategy: state.workspaceSettings.warehousePreferenceStrategy }); }
      if (state.operational && (state.operational.version !== this.operationalVersion || state.operational.workspaceId !== this.operationalWorkspaceId)) { this.operationalVersion = state.operational.version; this.operationalWorkspaceId = state.operational.workspaceId; this.operationalForm.reset({ ...state.operational, operatingHoursStart: state.operational.operatingHoursStart.slice(0, 5), operatingHoursEnd: state.operational.operatingHoursEnd.slice(0, 5) }); }
      if (state.security && state.security.version !== this.securityVersion) { this.securityVersion = state.security.version; this.securityForm.reset({ ...state.security, requiredEmailDomain: state.security.requiredEmailDomain ?? '' }); }
      if (state.notifications && (state.notifications.version !== this.notificationVersion || state.selectedWorkspaceId !== this.notificationWorkspaceId)) { this.notificationVersion = state.notifications.version; this.notificationWorkspaceId = state.selectedWorkspaceId; }
    });
  }

  saveRegional(): void { if (!this.canSubmit(this.regionalForm)) return; this.facade.updateRegional(this.regionalForm.getRawValue(), this.regionalVersion); }
  saveUnits(): void { if (!this.canSubmit(this.unitsForm)) return; this.facade.updateUnits(this.unitsForm.getRawValue(), this.unitsVersion); }
  saveWorkspaceSettings(): void { if (!this.canSubmit(this.workspaceSettingsForm)) return; this.facade.updateWorkspaceSettings(this.workspaceSettingsForm.getRawValue(), this.workspaceSettingsVersion); }
  saveOperational(): void { if (!this.canSubmit(this.operationalForm)) return; this.facade.updateOperational(this.operationalForm.getRawValue(), this.operationalVersion); }
  saveSecurity(): void { if (!this.canSubmit(this.securityForm)) return; const value = this.securityForm.getRawValue(); this.facade.updateSecurity({ ...value, requiredEmailDomain: value.requiredEmailDomain || null }, this.securityVersion); }
  toggleNotification(preference: NotificationPreference): void {
    const current = this.facade.state().notifications;
    if (!this.facade.canManage() || !current) return;
    const preferences = current.preferences.map((item) => item.eventCategory === preference.eventCategory && item.channel === preference.channel ? { ...item, enabled: !item.enabled } : item);
    this.facade.updateNotifications({ preferences, version: current.version }, this.notificationVersion);
  }
  createCustomField(): void { if (!this.canSubmit(this.customFieldForm)) return; this.facade.createCustomField(this.customFieldForm.getRawValue()); this.customFieldForm.reset({ fieldKey: '', label: '', fieldKind: 'TEXT', scope: 'CLIENT_ACCOUNT', required: false, uniqueValue: false, displayOrder: 0, active: true }); }
  toggleCustomField(field: CustomFieldDefinition): void { this.facade.toggleCustomField(field); }
  editCustomField(field: CustomFieldDefinition): void {
    this.editingCustomFieldId = field.id;
    this.customFieldEditForm.reset({ fieldKey: field.fieldKey, label: field.label, fieldKind: field.fieldKind, scope: field.scope, required: field.required, uniqueValue: field.uniqueValue, displayOrder: field.displayOrder, active: field.active });
  }
  cancelCustomFieldEdit(): void { this.editingCustomFieldId = null; this.customFieldEditForm.reset(); }
  saveCustomField(): void {
    if (!this.editingCustomFieldId || !this.canSubmit(this.customFieldEditForm)) return;
    const field = this.facade.state().customFields.find((item) => item.id === this.editingCustomFieldId);
    if (!field) return;
    this.facade.updateCustomField(field.id, this.customFieldEditForm.getRawValue(), field.version);
    this.cancelCustomFieldEdit();
  }

  private canSubmit(form: { invalid: boolean; markAllAsTouched: () => void }): boolean { if (!this.facade.canManage() || form.invalid) { form.markAllAsTouched(); return false; } return true; }
}
