import _ from 'lodash';
import { Query } from 'mongoose';
import Volunteer from '../models/Volunteer';
import { IVolunteer } from '../models/types';
import * as UserCtrl from './UserCtrl';
import * as UserActionCtrl from './UserActionCtrl';
import { UpdateScheduleOptions } from './types';

export async function updateSchedule(
  options: UpdateScheduleOptions
): Promise<void> {
  const user = options.user;
  const newAvailability = options.availability;
  const newTimezone = options.tz;
  const ip = options.ip;

  // verify that newAvailability is defined and not null
  if (!newAvailability) {
    // early exit
    throw new Error('No availability object specified');
  }

  // verify that all of the day-of-week and time-of-day properties are defined on the
  // new availability object
  if (
    Object.keys(user.availability).some(key => {
      if (typeof newAvailability[key] === 'undefined') {
        // day-of-week property needs to be defined
        return true;
      }

      // time-of-day properties also need to be defined
      return Object.keys(user.availability[key]).some(
        key2 => typeof newAvailability[key][key2] === 'undefined'
      );
    })
  ) {
    throw new Error('Availability object missing required keys');
  }

  const userUpdates: Partial<IVolunteer> = {
    availability: newAvailability,
    timezone: newTimezone
  };

  const currentTime = new Date();
  const newElapsedAvailability = UserCtrl.calculateElapsedAvailability(
    user,
    currentTime.toISOString()
  );
  userUpdates.availabilityLastModifiedAt = currentTime;
  userUpdates.elapsedAvailability =
    user.elapsedAvailability + newElapsedAvailability;

  // an onboarded volunteer must have updated their availability, completed required training, and unlocked a subject
  if (!user.isOnboarded && user.subjects.length > 0) {
    userUpdates.isOnboarded = true;
    UserActionCtrl.accountOnboarded(user._id, ip);
  }

  await Volunteer.updateOne({ _id: user._id }, userUpdates);
}

export async function clearSchedule(
  user: IVolunteer,
  tz: string
): Promise<void> {
  const clearedAvailability = _.reduce(
    user.availability,
    (clearedWeek, dayVal, dayKey) => {
      clearedWeek[dayKey] = _.reduce(
        dayVal,
        (clearedDay, hourVal, hourKey) => {
          clearedDay[hourKey] = false;
          return clearedDay;
        },
        {}
      );
      return clearedWeek;
    },
    {}
  );

  await updateSchedule({ user, tz, availability: clearedAvailability });
}
