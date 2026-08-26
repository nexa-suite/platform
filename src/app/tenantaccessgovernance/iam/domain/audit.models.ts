export interface AuditEvent {
  readonly id: string;
  readonly actorMembershipId: string | null;
  readonly actorWorkArea: string;
  readonly eventType: string;
  readonly subjectType: string;
  readonly subjectId: string | null;
  readonly correlationId: string | null;
  readonly occurredAt: string;
  readonly metadata: Readonly<Record<string, unknown>>;
}
