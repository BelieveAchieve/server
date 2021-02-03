import mongoose from 'mongoose';
import dbconnect from './dbconnect';
import Volunteer from '../models/Volunteer';

const isCertified = (certifications): boolean => {
  let isCertified = false;

  for (const subject in certifications) {
    if (
      certifications.hasOwnProperty(subject) &&
      certifications[subject].passed
    ) {
      isCertified = true;
      break;
    }
  }

  return isCertified;
};

const upgrade = async (): Promise<void> => {
  try {
    await dbconnect();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const volunteers: any = await Volunteer.find({})
      .lean()
      .exec();
    const onboardedVolunteers = new Set();
    const notOnboardedVolunteers = new Set();

    for (const volunteer of volunteers) {
      if (
        isCertified(volunteer.certifications) &&
        volunteer.availabilityLastModifiedAt
      )
        onboardedVolunteers.add(volunteer._id);
      else notOnboardedVolunteers.add(volunteer._id);
    }

    const results = await Volunteer.bulkWrite([
      {
        updateMany: {
          filter: { _id: { $in: Array.from(onboardedVolunteers) } },
          update: {
            $set: { isOnboarded: true }
          }
        }
      },
      {
        updateMany: {
          filter: { _id: { $in: Array.from(notOnboardedVolunteers) } },
          update: {
            $set: { isOnboarded: false }
          }
        }
      }
    ]);

    console.log(results);
  } catch (error) {
    console.error(error);
  }

  mongoose.disconnect();
};

async function downgrade(): Promise<void> {
  try {
    await dbconnect();
    const results = await Volunteer.updateMany(
      {},
      {
        $unset: {
          isOnboarded: ''
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
// DOWNGRADE=true npx ts-node dbutils/add-is-onboarded.ts
if (process.env.DOWNGRADE) {
  downgrade();
} else {
  upgrade();
}
