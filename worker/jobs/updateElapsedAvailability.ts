import * as Sentry from '@sentry/node';
import UserModel from '../../models/User';
import { User } from '../../models/types';

export default async (): Promise<void> => {
  // Fetch volunteers
  const volunteers = (await UserModel.find({ isVolunteer: true })) as User[];
  // Update elapsed availability
  await Promise.all(
    volunteers.map(volunteer => {
      const currentTime = new Date();
      const newElapsedAvailability = volunteer.calculateElapsedAvailability(
        currentTime
      );

      volunteer.elapsedAvailability += newElapsedAvailability;
      volunteer.availabilityLastModifiedAt = currentTime;

      return volunteer.save();
    })
  ).catch(error => {
    Sentry.captureException(error);
  });
};
