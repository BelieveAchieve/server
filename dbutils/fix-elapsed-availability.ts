import mongoose from 'mongoose';
import dbconnect from './dbconnect';
import VolunteerModel from '../models/Volunteer';

const main = async (): Promise<void> => {
  try {
    await dbconnect();

    const result = await VolunteerModel.updateMany(
      {
        $or: [{ isOnboarded: false }, { isApproved: false }]
      },
      {
        elapsedAvailability: 0
      }
    );

    console.log(result);
  } catch (error) {
    console.error(error);
  }

  mongoose.disconnect();
};

// To downgrade the migration run:
// npx ts-node dbutils/fix-elapsed-availability.ts
main()