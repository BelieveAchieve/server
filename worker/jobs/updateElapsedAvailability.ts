import * as Sentry from '@sentry/node';
import { map, size } from 'lodash';
import VolunteerModel from '../../models/Volunteer';
import { User } from '../../models/types';
import dbconnect from '../../dbutils/dbconnect';
import { log } from '../logger';
import UserCtrl from '../../controllers/UserCtrl';

export default async (): Promise<void> => {
  await dbconnect();
  // Fetch volunteers
  const volunteers = (await VolunteerModel.find()
    .lean()
    .exec()) as User[];
  await Promise.all(
    map(volunteers, async volunteer => {
      const updates: {
        elapsedAvailability?: number;
        availabilityLastModifiedAt?: Date;
      } = {};
      const currentTime = new Date();
      const newElapsedAvailability = UserCtrl.calculateElapsedAvailability(
        volunteer,
        currentTime
      );

      updates.elapsedAvailability =
        volunteer.elapsedAvailability + newElapsedAvailability;
      if (volunteer.availabilityLastModifiedAt)
        updates.availabilityLastModifiedAt = currentTime;

      return VolunteerModel.updateOne({ _id: volunteer._id }, updates);
    })
  );
  log(`updated ${size(volunteers)} volunteers`);
};
