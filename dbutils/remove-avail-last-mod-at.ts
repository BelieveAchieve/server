import mongoose from 'mongoose';
import UserAction from '../models/UserAction';
import Volunteer from '../models/Volunteer';
import dbconnect from './dbconnect';

const main = async (): Promise<void> => {
  try {
    await dbconnect();

    // When user action updated availability was first implemented
    const FIRST_INSTANCE_OF_UPDATED_AVAILABILITY = new Date(
      '2020-02-17T23:21:10.728+00:00'
    );

    // Get a list of volunteers that have manually updated their availability
    const volunteersThatUpdatedAvail = await UserAction.aggregate([
      { $match: { action: 'UPDATED AVAILABILITY' } },
      { $group: { _id: '$user' } }
    ]);

    // Query for volunteers that have never updated their availability manually,
    // but were created after UPDATED AVAILABILITY user action was implemented.
    // These accounts had availabilityLastModifiedAt updated by the cron job
    const volunteersThatNeverUpdatedAvail = await Volunteer.find(
      {
        _id: { $nin: volunteersThatUpdatedAvail },
        createdAt: { $gte: FIRST_INSTANCE_OF_UPDATED_AVAILABILITY }
      },
      { _id: 1 }
    )
      .lean()
      .exec();

    const result = await Volunteer.updateMany(
      {
        _id: { $in: volunteersThatNeverUpdatedAvail }
      },
      { $unset: { availabilityLastModifiedAt: '' } }
    );

    console.log(result);
  } catch (error) {
    console.error(error);
  }

  mongoose.disconnect();
};

main();
