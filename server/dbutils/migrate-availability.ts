import mongoose from 'mongoose';
import dbconnect from './dbconnect';
import VolunteerModel from '../models/Volunteer';
import { getAvailabilities } from '../services/AvailabilityService';

// remove availability from volunteers
async function upgrade(): Promise<void> {
  try {
    await dbconnect();

    const results = await VolunteerModel.updateMany(
      {},
      {
        $unset: { availability: '' }
      }
    );

    console.log(results);
  } catch (error) {
    console.error(error);
  }

  mongoose.disconnect();
}

// Add availability from availability snapshots to volunteers
async function downgrade(): Promise<void> {
  try {
    await dbconnect();

    const availabilitySnapshots: any = await getAvailabilities({});
    const updates = [];

    for (const snapshot of availabilitySnapshots) {
      updates.push(
        VolunteerModel.updateOne(
          {
            _id: snapshot.volunteerId
          },
          {
            availability: snapshot.onCallAvailability
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

// To downgrade the migration run:
// DOWNGRADE=true npx ts-node dbutils/migrate-availability.ts
if (process.env.DOWNGRADE) {
  downgrade();
} else {
  upgrade();
}
