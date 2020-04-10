import Sentry from '@sentry/node';
import User from '../../models/User';
import { IUser } from '../../models/types';

export default async () => {
  // Fetch volunteers
  const volunteers = (await User.find({ isVolunteer: true })) as IUser[];
  // Update elapsed availability
  await Promise.all(
    volunteers.map(volunteer => {
      console.log(volunteer);
      const currentTime = new Date();
      const newElapsedAvailability = volunteer.calculateElapsedAvailability(
        currentTime,
      );

      volunteer.elapsedAvailability += newElapsedAvailability;
      volunteer.availabilityLastModifiedAt = currentTime;

      return volunteer.save();
    }),
  ).catch(error => {
    Sentry.captureException(error);
  });
};
