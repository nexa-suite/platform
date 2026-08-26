import { Injectable } from '@angular/core';
import { AccessTokenPort } from '../../domain/ports/access-token.port';

@Injectable({ providedIn: 'root' })
export class AccessTokenStore implements AccessTokenPort {
  private token: string | null = null;

  read(): string | null {
    return this.token;
  }

  write(token: string): void {
    this.token = token;
  }

  clear(): void {
    this.token = null;
  }
}
