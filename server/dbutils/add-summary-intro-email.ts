import mongoose from 'mongoose';
import dbconnect from './dbconnect';
import VolunteerModel from '../models/Volunteer';

const upgrade = async (): Promise<void> => {
  try {
    await dbconnect();

    const results = await VolunteerModel.updateMany(
      {},
      {
        sentHourSummaryIntroEmail: false
      }
    );
    console.log(results);
  } catch (error) {
    console.error(error);
  }

  mongoose.disconnect();
};

async function downgrade(): Promise<void> {
  try {
    await dbconnect();
    const results = await VolunteerModel.updateMany(
      {},
      {
        $unset: {
          sentHourSummaryIntroEmail: ''
        }
      }
    );
    console.log(results);
  } catch (error) {
    console.error(error);
  }

  mongoose.disconnect();
}

// To downgrade the migration run:
// DOWNGRADE=true npx ts-node dbutils/add-summary-intro-email.ts
if (process.env.DOWNGRADE) {
  downgrade();
} else {
  upgrade();
}
