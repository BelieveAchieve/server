import mongoose from 'mongoose';
import Volunteer from '../models/Volunteer';
import dbconnect from './dbconnect';

async function upgrade(): Promise<void> {
  try {
    await dbconnect();
    const result = await Volunteer.updateMany(
      {},
      { sentReadyToCoachEmail: true }
    );
    console.log(result);
  } catch (error) {
    console.log('error', error);
  }

  mongoose.disconnect();
}

async function downgrade(): Promise<void> {
  try {
    await dbconnect();
    const result = await Volunteer.updateMany(
      {},
      {
        $unset: {
          sentReadyToCoachEmail: ''
        }
      }
    );
    console.log(result);
  } catch (error) {
    console.error(error);
  }

  mongoose.disconnect();
}

// To downgrade the migration run:
// DOWNGRADE=true npx ts-node dbutils/add-sentReadyToCoachEmail.ts
if (process.env.DOWNGRADE) {
  downgrade();
} else {
  upgrade();
}
