import { Observable } from 'rxjs';
import { AuthSession, SignInCommand } from '../models/auth.models';

/** Port owned by IAM; HTTP is implemented only by infrastructure. */
export abstract class AuthApiPort {
  abstract login(command: SignInCommand): Observable<AuthSession>;
  abstract refresh(): Observable<AuthSession>;
  abstract currentSession(accessToken: string): Observable<AuthSession>;
  abstract signOut(accessToken: string | null): Observable<void>;
}
