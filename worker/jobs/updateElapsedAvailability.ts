import * as Sentry from '@sentry/node';
import { size, map } from 'lodash';
import * as UserModel from '../../models/User';
import { User } from '../../models/types';
import * as dbconnect from '../../dbutils/dbconnect';
import { log } from '../logger';

export default async (): Promise<void> => {
  try {
    await dbconnect();
    // Fetch volunteers
    const volunteers = (await UserModel.find({
      isVolunteer: true
    }).exec()) as User[];
    await Promise.all(
      map(volunteers, async volunteer => {
        const currentTime = new Date();
        const newElapsedAvailability = volunteer.calculateElapsedAvailability(
          currentTime
        );

        volunteer.elapsedAvailability += newElapsedAvailability;
        volunteer.availabilityLastModifiedAt = currentTime;

        await volunteer.save();
      })
    );
    log(`updated ${size(volunteers)} volunteers`);
  } catch (error) {
    log(error);
    Sentry.captureException(error);
  }
};
