import mongoose from 'mongoose';
import Volunteer from '../models/Volunteer';
import dbconnect from './dbconnect';

async function upgrade(): Promise<void> {
  try {
    await dbconnect();
    const subject = {
      passed: false,
      tries: 0
    };
    const result = await Volunteer.updateMany(
      {},
      {
        $set: {
          'certifications.upchieve101': subject,
          'certifications.trainingSkills': subject,
          'certifications.collegeSkills': subject
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
    const results = await Volunteer.updateMany(
      {},
      {
        $unset: {
          'certifications.upchieve101': '',
          'certifications.trainingSkills': '',
          'certifications.collegeSkills': ''
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
// npx ts-node dbutils/add-training-certs.ts

// To downgrade the migration run:
// DOWNGRADE=true npx ts-node dbutils/add-training-certs.ts
if (process.env.DOWNGRADE) {
  downgrade();
} else {
  upgrade();
}
