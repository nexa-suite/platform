import { Observable } from 'rxjs';
import { ActiveSession, Profile, Registration } from '../security.models';

/** Port for the authenticated user's security/profile resources. */
export abstract class SecurityApiPort {
  abstract profile(): Observable<Profile>;
  abstract updateProfile(value: { displayName: string; phone: string; preferredLanguage: string; timezone: string }, version: number): Observable<Profile>;
  abstract changePassword(currentPassword: string, newPassword: string): Observable<void>;
  abstract sessions(): Observable<{ sessions: ActiveSession[] }>;
  abstract revokeSession(sessionId: string): Observable<void>;
  abstract revokeOtherSessions(): Observable<void>;
  abstract requestReset(email: string): Observable<{ message: string }>;
  abstract resetPassword(token: string, newPassword: string): Observable<void>;
  abstract registerOrganization(value: unknown): Observable<Registration>;
  abstract registration(id: string, statusToken: string): Observable<Registration>;
}
