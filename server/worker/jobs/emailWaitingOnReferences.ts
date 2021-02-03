import { log } from '../logger';
import VolunteerModel from '../../models/Volunteer';
import { REFERENCE_STATUS } from '../../constants';
import MailService from '../../services/MailService';

// Runs every day at 11am EST
export default async (): Promise<void> => {
  const oneDay = 1000 * 60 * 60 * 24 * 1;
  const fiveDaysAgo = Date.now() - oneDay * 5;
  const sixDaysAgo = fiveDaysAgo - oneDay;
  const query = {
    'references.status': REFERENCE_STATUS.SENT,
    'references.sentAt': {
      $gt: new Date(sixDaysAgo),
      $lt: new Date(fiveDaysAgo)
    }
  };

  const volunteers = await VolunteerModel.find(query)
    .select('firstname email')
    .lean()
    .exec();

  let totalEmailed = 0;

  for (const volunteer of volunteers) {
    try {
      await MailService.sendWaitingOnReferences(volunteer);
      totalEmailed++;
    } catch (error) {
      log(
        `Failed to send "waiting on references" email to volunteer ${volunteer._id}: ${error}`
      );
    }
  }

  return log(
    `Emailed ${totalEmailed} volunteers that we're waiting on their reference(s)`
  );
};
