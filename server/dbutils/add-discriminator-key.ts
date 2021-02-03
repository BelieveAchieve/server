import mongoose from 'mongoose';
import User from '../models/User';
import dbconnect from './dbconnect';

// Run:
// npx ts-node dbutils/add-discriminator-key.ts
async function upgrade(): Promise<void> {
  try {
    await dbconnect();
    const results = await User.bulkWrite([
      {
        updateMany: {
          filter: { isVolunteer: false },
          // mongoose adds $set to their update operators
          update: { type: 'Student' }
        }
      },
      {
        updateMany: {
          filter: { isVolunteer: true },
          update: { type: 'Volunteer' }
        }
      }
    ]);
    console.log('Updated: ', results);
  } catch (error) {
    console.error(error);
  }

  mongoose.disconnect();
}

// npx ts-node dbutils/add-discriminator-key.ts
async function downgrade(): Promise<void> {
  try {
    await dbconnect();
    const results = await User.updateMany({}, { $unset: { type: '' } });
    console.log('Updated: ', results);
  } catch (error) {
    console.error(error);
  }

  mongoose.disconnect();
}

// To downgrade the migration run:
// DOWNGRADE=true npx ts-node dbutils/add-discriminator-key.ts
if (process.env.DOWNGRADE) {
  downgrade();
} else {
  upgrade();
}
