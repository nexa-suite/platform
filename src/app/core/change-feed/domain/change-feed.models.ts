export interface ChangeEvent {
  readonly id: string;
  readonly eventType: string;
  readonly resourceType: string;
  readonly resourceId: string | null;
  readonly tenantId: string | null;
  readonly workspaceId: string | null;
  readonly occurredAt: string;
  readonly payload: Readonly<Record<string, unknown>>;
}
