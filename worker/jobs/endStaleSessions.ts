import SessionService from '../../services/SessionService';
import dbconnect from '../../dbutils/dbconnect';
import { log } from '../logger';

export default async (): Promise<void> => {
  await dbconnect();
  const staleSessions = await SessionService.getStaleSessions();
  for (const session of staleSessions) {
    await SessionService.endSession({ session, isAdmin: true });
  }
  log(`ended ${staleSessions.length} sessions`);
};
