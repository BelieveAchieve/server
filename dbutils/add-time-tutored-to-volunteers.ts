import mongoose, { Types, Document } from 'mongoose';
import dbconnect from './dbconnect';
import VolunteerModel from '../models/Volunteer';

interface Volunteer {
  _id: Types.ObjectId;
  hoursTutored: number;
}

// Add timeTutored to volunteers
async function upgrade(): Promise<void> {
  try {
    await dbconnect();

    const volunteers = await VolunteerModel.find()
      .select({ hoursTutored: 1 })
      .lean()
      .exec();
    const updates = [];
    for (const volunteer of volunteers) {
      const { hoursTutored, _id } = volunteer as Volunteer;
      const timeTutored = Math.floor(Number(hoursTutored.toString()) * 3600000);

      updates.push(
        VolunteerModel.updateOne(
          {
            _id
          },
          {
            timeTutored
          }
        )
      );
    }

    const results = await Promise.all(updates);
    console.log(results);
  } catch (error) {
    console.error(error);
  }

  mongoose.disconnect();
}

// Remove time tutored
async function downgrade(): Promise<void> {
  try {
    await dbconnect();

    const results = await VolunteerModel.updateMany(
      {},
      {
        $unset: { timeTutored: '' }
      }
    );
    console.log(results);
  } catch (error) {
    console.error(error);
  }

  mongoose.disconnect();
}

// To downgrade the migration run:
// DOWNGRADE=true npx ts-node dbutils/add-time-tutored-to-volunteers.ts
if (process.env.DOWNGRADE) {
  downgrade();
} else {
  upgrade();
}
