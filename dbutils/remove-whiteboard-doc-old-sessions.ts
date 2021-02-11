import mongoose from 'mongoose';
import dbconnect from './dbconnect';
import SessionModel from '../models/Session';
import { SUBJECT_TYPES } from '../constants';

// whiteboard docs prior to this date have a different format that is unusable
const cutOffDate = new Date('2020-11-18T00:00:00.000+00:00');

async function main(): Promise<void> {
  try {
    await dbconnect();

    // Sessions prior to the cut off date will have their whiteboard doc removed
    const results = await SessionModel.updateMany(
      {
        type: { $ne: SUBJECT_TYPES.COLLEGE },
        createdAt: { $lt: cutOffDate }
      },
      {
        $unset: {
          whiteboardDoc: ''
        }
      }
    )
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    console.log(results);
  } catch (error) {
    console.error(error);
  }

  mongoose.disconnect();
}

// npx ts-node dbutils/remove-whiteboard-doc-old-sessions.ts
main();
