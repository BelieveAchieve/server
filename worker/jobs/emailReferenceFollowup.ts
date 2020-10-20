import { log } from '../logger';
import VolunteerModel from '../../models/Volunteer';
import { Reference } from '../../models/types';
import { REFERENCE_STATUS } from '../../constants';
import MailService from '../../services/MailService';

// @note: uses firstName instead of firstname because of the $project aggregation stage
// @todo: clean up Volunteer model to use firstName instead of firstname
interface Volunteer {
  firstName: string;
  lastName: string;
}

interface ReferencesToEmail {
  reference: Reference;
  volunteer: Volunteer;
}

// Runs every day at 10am EST
export default async (): Promise<void> => {
  const oneDay = 1000 * 60 * 60 * 24 * 1;
  const threeDaysAgo = Date.now() - oneDay * 3;
  const fourDaysAgo = threeDaysAgo - oneDay;
  const query = {
    'references.status': REFERENCE_STATUS.SENT,
    'references.sentAt': {
      $gt: new Date(fourDaysAgo),
      $lt: new Date(threeDaysAgo)
    }
  };
  const referencesToEmail: ReferencesToEmail[] = await VolunteerModel.aggregate(
    [
      {
        $match: query
      },
      {
        $unwind: '$references'
      },
      {
        /**
         * Since references are stored in an array on the volunteer, one reference with a status of
         * "SENT" and another with a status of "SUBMITTED" would pass through the first $match stage.
         * $unwind allows us to get separate documents from that array, but we need to filter by the
         * same query to get only references with a status of "SENT"
         **/
        $match: query
      },
      {
        $project: {
          _id: 0,
          volunteer: {
            firstName: '$firstname',
            lastName: '$lastname'
          },
          reference: '$references'
        }
      }
    ]
  );

  let totalEmailed = 0;

  if (referencesToEmail.length === 0)
    return log('No references to email for a follow-up');

  for (const ref of referencesToEmail) {
    try {
      await MailService.sendReferenceFollowup(ref);
      totalEmailed++;
    } catch (error) {
      log(`Error notifying reference ${ref.reference._id}: ${error}`);
    }
  }

  return log(`Emailed ${totalEmailed} references a follow-up`);
};
