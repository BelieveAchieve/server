import mongoose from 'mongoose';
import User from '../models/User';
import dbconnect from './dbconnect';

async function upgrade(): Promise<void> {
  try {
    await dbconnect();
    const subject = {
      passed: false,
      tries: 0
    };
    const result = await User.updateMany(
      { isVolunteer: true },
      {
        $set: {
          'certifications.chemistry': subject,
          'certifications.physics': subject
        }
      },
      { strict: false }
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
    const results = await User.updateMany(
      { isVolunteer: true },
      {
        $unset: {
          'certifications.chemistry': '',
          'certifications.physics': ''
        }
      }
    );
    console.log(results);
  } catch (error) {
    console.error(error);
  }

  mongoose.disconnect();
}

// To run migration:
// npx ts-node dbutils/add-chemistry-physics.ts

// To downgrade the migration run:
// DOWNGRADE=true npx ts-node dbutils/add-chemistry-physics.ts
if (process.env.DOWNGRADE) {
  downgrade();
} else {
  upgrade();
}
