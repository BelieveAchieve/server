import mongoose from 'mongoose';
import Volunteer from '../models/Volunteer';
import dbconnect from './dbconnect';

async function upgrade(): Promise<void> {
  try {
    await dbconnect();
    const volunteers: any = await Volunteer.find()
      .lean()
      .exec();

    const updates = [];

    for (const volunteer of volunteers) {
      const { _id, subjects } = volunteer;
      const updatedSubjects = subjects.map(subject => {
        return {
          subject,
          isActivated: true
        };
      });

      updates.push(Volunteer.updateOne({ _id }, { subjects: updatedSubjects }));
    }

    const results = await Promise.all(updates);
    console.log(results);
  } catch (error) {
    console.log('error', error);
  }

  mongoose.disconnect();
}

async function downgrade(): Promise<void> {
  try {
    await dbconnect();
    const volunteers: any = await Volunteer.find()
      .lean()
      .exec();

    const updates = [];
    for (const volunteer of volunteers) {
      const { _id, subjects } = volunteer;
      const updatedSubjects = subjects.map(subject => subject.subject);

      updates.push(Volunteer.updateOne({ _id }, { subjects: updatedSubjects }));
    }

    const results = await Promise.all(updates);
  } catch (error) {
    console.error(error);
  }

  mongoose.disconnect();
}

// To downgrade the migration run:
// DOWNGRADE=true npx ts-node dbutils/update-subjects.ts
if (process.env.DOWNGRADE) {
  downgrade();
} else {
  upgrade();
}
