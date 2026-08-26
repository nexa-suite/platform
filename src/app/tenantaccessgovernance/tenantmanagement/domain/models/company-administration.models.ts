export interface OrganizationSummary {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly status: string;
  readonly currentWorkspaceId: string;
  readonly currentWorkspaceName: string;
  readonly version: number;
}

export interface WorkspaceSummary {
  readonly id: string;
  readonly tenantId?: string;
  readonly name: string;
  readonly slug: string;
  readonly status: string;
  readonly version: number;
}

export interface WorkspaceDetails {
  readonly workspace: WorkspaceSummary;
  readonly memberships: readonly WorkspaceMembershipSummary[];
}

export interface WorkspaceMembershipSummary {
  readonly id: string;
  readonly workspaceId: string;
  readonly userId: string;
  readonly email: string;
  readonly displayName: string;
  readonly status: string;
  readonly version: number;
  readonly roles: readonly string[];
  readonly roleDefinitionIds?: readonly string[];
  readonly permissionCodes?: readonly string[];
}

export interface RoleDefinition {
  readonly id: string;
  readonly tenantId: string | null;
  readonly workspaceId: string | null;
  readonly type: 'SYSTEM_RESERVED' | 'SYSTEM_TEMPLATE' | 'CUSTOM' | string;
  readonly code: string;
  readonly name: string;
  readonly description: string;
  readonly permissions: readonly string[];
  readonly status: 'ACTIVE' | 'INACTIVE' | string;
  readonly createdBy: string | null;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
  readonly version: number;
}

export interface OrganizationProfile {
  readonly legalName: string;
  readonly displayName: string;
  readonly businessIdentifier: string | null;
  readonly operationCategory: string;
  readonly version: number;
}

export interface WorkspaceSettings {
  readonly workspaceId: string;
  readonly defaultWorkspaceBehavior: string;
  readonly warehousePreferenceStrategy: string;
  readonly version: number;
}

export interface RegionalSettings {
  readonly timezone: string;
  readonly language: string;
  readonly currency: string;
  readonly countryRegion: string;
  readonly dateTimePolicy: string;
  readonly locale: string;
  readonly version: number;
}

export interface UnitPreferences {
  readonly massUnit: string;
  readonly temperatureUnit: string;
  readonly distanceUnit: string;
  readonly volumeUnit: string;
  readonly version: number;
}

export interface OperationalSettings {
  readonly workspaceId: string;
  readonly defaultWarehouseSelectionPolicy: string;
  readonly orderCutoffPolicy: string;
  readonly fulfillmentDefaults: string;
  readonly inventoryVisibilityPolicy: string;
  readonly buyerAvailabilityPolicy: string;
  readonly operatingHoursStart: string;
  readonly operatingHoursEnd: string;
  readonly orderCutoffMinutes: number;
  readonly thermalLogRequired: boolean;
  readonly version: number;
}

export interface NotificationPreference {
  readonly eventCategory: string;
  readonly channel: 'IN_APP' | 'EMAIL';
  readonly enabled: boolean;
  readonly version: number;
}

export interface NotificationSettings {
  readonly preferences: readonly NotificationPreference[];
  readonly version: number;
}

export interface TenantSecuritySettings {
  readonly passwordMinLength: number;
  readonly sessionDurationMinutes: number;
  readonly invitationExpirationHours: number;
  readonly requiredEmailDomain: string | null;
  readonly version: number;
}

export interface CustomFieldDefinition {
  readonly id: string;
  readonly fieldKey: string;
  readonly label: string;
  readonly fieldKind: string;
  readonly scope: string;
  readonly required: boolean;
  readonly uniqueValue: boolean;
  readonly displayOrder: number;
  readonly active: boolean;
  readonly version: number;
}

export interface InvitationView {
  readonly id: string;
  readonly workspaceId: string;
  readonly email: string;
  readonly displayName: string;
  readonly roles: readonly string[];
  readonly status: string;
  readonly expiresAt: string;
  readonly version: number;
  readonly createdAt: string;
}

export interface InvitationList {
  readonly items: readonly InvitationView[];
  readonly page: number;
  readonly pageSize: number;
  readonly hasNext: boolean;
}

export interface InvitationAcceptanceCommand {
  readonly token: string;
  readonly password: string;
  readonly displayName: string | null;
}

export interface InvitationAcceptanceResult {
  readonly invitationId: string;
  readonly userId: string;
  readonly workspaceId: string;
  readonly roles: readonly string[];
}

export interface AccessMatrixEntry {
  readonly role: string;
  readonly permissions: readonly string[];
}

export interface PlanUsage {
  readonly planCode: string;
  readonly monthlyPrice: number;
  readonly seatLimit: number;
  readonly workspaceLimit: number;
  readonly transactionLimit: number;
  readonly activeUsers: number;
  readonly workspaceCount: number;
  readonly transactionCount: number;
  readonly version: number;
}

export interface PlanOption {
  readonly planCode: string;
  readonly monthlyPrice: number;
  readonly seatLimit: number;
  readonly workspaceLimit: number;
  readonly transactionLimit: number;
  readonly current: boolean;
}

export interface TenantAdministrationState {
  readonly status: 'idle' | 'loading' | 'success' | 'error';
  readonly organization: OrganizationSummary | null;
  readonly profile: OrganizationProfile | null;
  readonly workspaces: readonly WorkspaceSummary[];
  readonly memberships: readonly WorkspaceMembershipSummary[];
  readonly roleDefinitions: readonly RoleDefinition[];
  readonly membershipDetail: WorkspaceMembershipSummary | null;
  readonly workspaceSettings: WorkspaceSettings | null;
  readonly regional: RegionalSettings | null;
  readonly units: UnitPreferences | null;
  readonly operational: OperationalSettings | null;
  readonly notifications: NotificationSettings | null;
  readonly security: TenantSecuritySettings | null;
  readonly customFields: readonly CustomFieldDefinition[];
  readonly invitations: InvitationList;
  readonly accessMatrix: readonly AccessMatrixEntry[];
  readonly planUsage: PlanUsage | null;
  readonly planComparison: readonly PlanOption[];
  readonly selectedWorkspaceId: string | null;
  readonly message: string | null;
  readonly notice: string | null;
}

export type CompanyAdministrationState = TenantAdministrationState;

export const INITIAL_TENANT_ADMINISTRATION_STATE: TenantAdministrationState = {
  status: 'idle',
  organization: null,
  profile: null,
  workspaces: [],
  memberships: [],
  roleDefinitions: [],
  membershipDetail: null,
  workspaceSettings: null,
  regional: null,
  units: null,
  operational: null,
  notifications: null,
  security: null,
  customFields: [],
  invitations: { items: [], page: 0, pageSize: 25, hasNext: false },
  accessMatrix: [],
  planUsage: null,
  planComparison: [],
  selectedWorkspaceId: null,
  message: null,
  notice: null
};
