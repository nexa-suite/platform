import { Observable } from 'rxjs';
import { PlatformNotification } from '../notification.models';

/** Port for the existing notification feed and read-state endpoints. */
export abstract class NotificationsApiPort {
  abstract list(limit?: number): Observable<readonly PlatformNotification[]>;
  abstract markRead(id: string): Observable<void>;
  abstract markAllRead(): Observable<void>;
}
