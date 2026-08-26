/** Session token boundary used by the IAM application services. */
export abstract class AccessTokenPort {
  abstract read(): string | null;
  abstract write(token: string): void;
  abstract clear(): void;
}
