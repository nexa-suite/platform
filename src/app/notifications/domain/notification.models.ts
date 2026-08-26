export interface PlatformNotification {
  readonly id: string;
  readonly category: string;
  readonly title: string;
  readonly message: string;
  readonly deepLink: string | null;
  readonly subjectType: string | null;
  readonly createdAt: string;
  readonly read: boolean;
}
