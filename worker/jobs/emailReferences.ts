import * as Sentry from '@sentry/node';
import { flatten } from 'lodash';
import dbconnect from '../../dbutils/dbconnect';
import { log } from '../logger';
import VolunteerModel from '../../models/Volunteer';
import { Volunteer, Reference } from '../../models/types';
import MailService from '../../services/MailService';
import { REFERENCE_STATUS } from '../../constants';

interface UnsentReference {
  reference: Reference;
  volunteer: Volunteer;
}

export default async (): Promise<void> => {
  try {
    await dbconnect();

    const volunteers = (await VolunteerModel.find({
      'references.status': REFERENCE_STATUS.UNSENT
    })
      .lean()
      .exec()) as Volunteer[];

    const unsent: UnsentReference[] = flatten(
      volunteers.map(vol => {
        return vol.references
          .filter(ref => ref.status === REFERENCE_STATUS.UNSENT)
          .map(ref => ({
            reference: ref,
            volunteer: vol
          }));
      })
    );

    if (unsent.length === 0) return log('No references to email');

    for (const u of unsent) {
      await MailService.sendReferenceForm({
        reference: u.reference,
        volunteer: u.volunteer
      });
    }

    return log(`Emailed ${unsent.length} references`);
  } catch (error) {
    log(error);
    Sentry.captureException(error);
  }
};
