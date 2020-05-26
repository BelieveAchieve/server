import * as Sentry from '@sentry/node';
import { map, size } from 'lodash';
import UserModel from '../../models/User';
import { User } from '../../models/types';
import dbconnect from '../../dbutils/dbconnect';
import { log } from '../logger';
import UserCtrl from '../../controllers/UserCtrl';

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
        const newElapsedAvailability = UserCtrl.calculateElapsedAvailability(
          volunteer.toObject(),
          currentTime
        );

        volunteer.elapsedAvailability += newElapsedAvailability;
        if (volunteer.availabilityLastModifiedAt)
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
