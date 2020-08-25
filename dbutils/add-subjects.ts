import mongoose from 'mongoose';
import dbconnect from './dbconnect';
import Volunteer from '../models/Volunteer';
import TrainingCtrl from '../controllers/TrainingCtrl';
import { TRAINING } from '../constants';

const upgrade = async (): Promise<void> => {
  try {
    await dbconnect();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const volunteers: any = await Volunteer.find({})
      .lean()
      .exec();

    const pendingUpdates = [];

    for (const volunteer of volunteers) {
      // Ignore required training for existing users in order to get unlocked subjects
      Object.assign(volunteer.certifications, {
        [TRAINING.TUTORING_SKILLS]: { passed: true, tries: 1 },
        [TRAINING.UPCHIEVE_101]: { passed: false, tries: 1 },
        [TRAINING.SAT_STRATEGIES]: { passed: false, tries: 1 },
        // @note set to true in getUnlockedSubjects, but we do not want to set this to true
        // when college counseling course is added since this will unlock college planning and applications
        [TRAINING.COLLEGE_COUNSELING]: { passed: false, tries: 1 }
      });
      const subjects = TrainingCtrl.getUnlockedSubjects(
        TRAINING.UPCHIEVE_101,
        volunteer.certifications
      );

      pendingUpdates.push(
        Volunteer.updateOne(
          { _id: volunteer._id },
          { subjects },
          { runValidators: true }
        )
      );
    }

    const result = await Promise.all(pendingUpdates);
    console.log(result);
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
// DOWNGRADE=true npx ts-node dbutils/add-subjects.ts
if (process.env.DOWNGRADE) {
  downgrade();
} else {
  upgrade();
}
