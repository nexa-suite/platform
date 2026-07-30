import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AccessTokenStore {
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
