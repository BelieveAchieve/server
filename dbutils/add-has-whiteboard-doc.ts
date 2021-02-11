import mongoose from 'mongoose';
import dbconnect from './dbconnect';
import SessionModel from '../models/Session';
import { SUBJECT_TYPES } from '../constants'

const upgrade = async (): Promise<void> => {
  try {
    await dbconnect();

    const results = await SessionModel.updateMany(
      { type: { $ne: SUBJECT_TYPES.COLLEGE } },
      { hasWhiteboardDoc: false }
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
    const results = await SessionModel.updateMany(
      { type: { $ne: 'college' } },
      {
        $unset: {
          hasWhiteboardDoc: ''
        }
      }
    );
    console.log(results);
  } catch (error) {
    console.error(error);
  }

  mongoose.disconnect();
}

// To run the migration:
// npx ts-node dbutils/add-has-whiteboard-doc.ts

// To downgrade the migration run:
// DOWNGRADE=true npx ts-node dbutils/add-has-whiteboard-doc.ts
if (process.env.DOWNGRADE) {
  downgrade();
} else {
  upgrade();
}
