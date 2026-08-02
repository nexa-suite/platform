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
  readonly name: string;
  readonly slug: string;
  readonly status: string;
  readonly version: number;
}

export interface WorkspaceMembershipSummary {
  readonly id: string;
  readonly userId: string;
  readonly email: string;
  readonly displayName: string;
  readonly roles: readonly string[];
  readonly status: string;
  readonly version: number;
}

export type CompanyAdministrationState =
  | { readonly status: 'idle' | 'loading' | 'success' | 'error'; readonly organization: OrganizationSummary | null; readonly workspaces: readonly WorkspaceSummary[]; readonly memberships: readonly WorkspaceMembershipSummary[]; readonly message: string | null };
