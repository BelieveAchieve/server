import { map } from 'lodash';
import moment from 'moment-timezone';
import VolunteerModel from '../../models/Volunteer';
import { Volunteer } from '../../models/types';
import { log } from '../logger';
import { AvailabilitySnapshot } from '../../models/Availability/Snapshot';
import {
  createAvailabilityHistory,
  getAvailability,
  getElapsedAvailability
} from '../../services/AvailabilityService';

export default async (): Promise<void> => {
  const volunteers = await VolunteerModel.find({
    isOnboarded: true,
    isApproved: true
  })
    .select({ _id: 1 })
    .lean()
    .exec();

  let totalUpdated = 0;

  await Promise.all(
    map(volunteers, async (volunteer: Volunteer) => {
      const availability: AvailabilitySnapshot = await getAvailability({
        volunteerId: volunteer._id
      });
      if (!availability) return;

      const endOfYesterday = moment()
        .utc()
        .subtract(1, 'days')
        .endOf('day');
      const yesterday = moment()
        .utc()
        .subtract(1, 'days')
        .format('dddd');
      const availabilityDay = availability.onCallAvailability[yesterday];
      const elapsedAvailability = getElapsedAvailability(availabilityDay);

      await VolunteerModel.updateOne(
        {
          _id: volunteer._id
        },
        { $inc: { elapsedAvailability } }
      );

      totalUpdated++;

      const newAvailabilityHistory = {
        availability: availabilityDay,
        volunteerId: volunteer._id,
        timezone: availability.timezone,
        date: endOfYesterday
      };
      return createAvailabilityHistory(newAvailabilityHistory);
    })
  );
  log(`updated ${totalUpdated} volunteers`);
};
