import { Observable } from 'rxjs';
import { AuthSession, AuthenticationResult, SignInCommand, WorkspacePreview } from '../models/auth.models';

/** Port owned by IAM; HTTP is implemented only by infrastructure. */
export abstract class AuthApiPort {
  abstract login(command: SignInCommand): Observable<AuthenticationResult>;
  abstract verifyTwoFactor(challengeId: string, code: string): Observable<AuthSession>;
  abstract workspacePreview(workspaceSlug: string): Observable<WorkspacePreview>;
  abstract refresh(): Observable<AuthSession>;
  abstract currentSession(accessToken: string): Observable<AuthSession>;
  abstract signOut(accessToken: string | null): Observable<void>;
}
