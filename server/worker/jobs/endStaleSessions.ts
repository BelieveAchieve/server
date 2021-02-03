import SessionService from '../../services/SessionService';
import { log } from '../logger';

export default async (): Promise<void> => {
  const staleSessions = await SessionService.getStaleSessions();
  for (const session of staleSessions) {
    await SessionService.endSession({ sessionId: session._id, isAdmin: true });
  }
  log(`ended ${staleSessions.length} sessions`);
};
