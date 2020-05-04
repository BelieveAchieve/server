import * as Sentry from '@sentry/node';
import { size } from 'lodash';
import moment from 'moment-timezone';
import * as UserModel from '../../models/User';
import * as MailService from '../../services/MailService';
import { User } from '../../models/types';
import * as dbconnect from '../../dbutils/dbconnect';
import { log } from '../logger';
import * as UserService from '../../services/UserService';

export default async (): Promise<void> => {
  try {
    await dbconnect();
    const volunteers = (await UserModel.find({ isVolunteer: true })
      .lean()
      .exec()) as User[];

    for (const volunteer of volunteers) {
      const {
        createdAt,
        certifications,
        availabilityLastModifiedAt,
        email,
        firstname: firstName
      } = volunteer;
      const threeDaysAgo = moment().subtract(3, 'days');
      const fourDaysAgo = moment().subtract(4, 'days');
      const wasRecentlyCreated = moment(createdAt).isBetween(
        fourDaysAgo,
        threeDaysAgo
      );
      const isCertified = UserService.isCertified(certifications);

      if ((!isCertified || !availabilityLastModifiedAt) && wasRecentlyCreated) {
        MailService.sendFinishOnboardingEmail({
          availabilityLastModifiedAt,
          isCertified,
          email,
          firstName
        });
      }
    }
    log(`updated ${size(volunteers)} volunteers`);
  } catch (error) {
    log(error);
    Sentry.captureException(error);
  }
};
