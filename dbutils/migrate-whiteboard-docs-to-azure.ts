import mongoose from 'mongoose';
import dbconnect from './dbconnect';
import SessionModel from '../models/Session';
import {
  uploadedToStorage,
  getDocFromStorage
} from '../services/WhiteboardService';
import { SUBJECT_TYPES } from '../constants';

const cutOffDate = new Date('2020-11-18T00:00:00.000+00:00');

// migrate whiteboard docs to azure
async function upgrade(): Promise<void> {
  try {
    await dbconnect();

    // Sessions after the cut off date will have their whiteboard doc moved to azure
    const sessions = await SessionModel.find({
      type: { $ne: SUBJECT_TYPES.COLLEGE },
      createdAt: { $gte: cutOffDate }
    })
      .lean()
      .exec();

    const updates = [];

    for (const session of sessions) {
      const hasWhiteboardDoc = await uploadedToStorage(
        session._id.toString(),
        session.whiteboardDoc
      );
      updates.push(
        SessionModel.updateOne(
          {
            _id: session._id
          },
          {
            hasWhiteboardDoc,
            $unset: {
              whiteboardDoc: ''
            }
          }
        )
      );
    }

    const results = await Promise.all(updates);
    console.log(results);

    // Sessions prior to the cut off date will have their whiteboard doc removed
    const oldSessionUpdateResults = await SessionModel.updateMany({
      type: { $ne: SUBJECT_TYPES.COLLEGE },
      createdAt: { $lt: cutOffDate }
    }, {
      $unset: {
        whiteboardDoc: ''
      }
     })
      .lean()
      .exec();
    console.log(oldSessionUpdateResults);
  } catch (error) {
    console.error(error);
  }

  mongoose.disconnect();
}

async function downgrade(): Promise<void> {
  try {
    await dbconnect();

    const sessions = await SessionModel.find({
      type: { $ne: SUBJECT_TYPES.COLLEGE },
      createdAt: { $gte: cutOffDate }
    })
      .lean()
      .exec();

    const updates = [];

    for (const session of sessions) {
      const whiteboardDoc = await getDocFromStorage(session._id.toString());
      updates.push(
        SessionModel.updateOne(
          {
            _id: session._id
          },
          {
            whiteboardDoc,
            hasWhiteboard: false
          }
        )
      );
    }

    const results = await Promise.all(updates);

    console.log(results);
  } catch (error) {
    console.error(error);
  }

  mongoose.disconnect();
}

// To downgrade the migration run:
// DOWNGRADE=true npx ts-node dbutils/migrate-whiteboard-docs-to-azure.ts
if (process.env.DOWNGRADE) {
  downgrade();
} else {
  upgrade();
}
