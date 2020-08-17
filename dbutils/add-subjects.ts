import mongoose from 'mongoose';
import dbconnect from './dbconnect';
import Volunteer from '../models/Volunteer';

const getCertifiedSubjects = (certifications): string[] => {
  let subjects = [];

  for (const subject in certifications) {
    if (
      certifications.hasOwnProperty(subject) &&
      certifications[subject].passed
    ) {
      subjects.push(subject)
      
    }
  }

  return subjects;
};

const upgrade = async (): Promise<void> => {
  try {
    await dbconnect();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const volunteers: any = await Volunteer.find({})
      .lean()
      .exec();

    const pendingUpdates = []

    for (const volunteer of volunteers) {
      const subjects = getCertifiedSubjects(volunteer.certifications)

      pendingUpdates.push(Volunteer.updateOne(
        { _id: volunteer._id}, 
        { subjects }, 
        { runValidators: true } ))
    }


    const result = await Promise.all(pendingUpdates)
    console.log("The result: ", result)
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
          subjects: ''
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
