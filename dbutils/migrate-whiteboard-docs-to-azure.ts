import mongoose from 'mongoose';
import dbconnect from './dbconnect';
import SessionModel from '../models/Session';
import {
  uploadedToStorage,
  getDocFromStorage
} from '../services/WhiteboardService';
import { SUBJECT_TYPES } from '../constants';

// migrate whiteboard docs to azure
async function upgrade(): Promise<void> {
  try {
    await dbconnect();

    const sessions = await SessionModel.find({
      type: { $ne: SUBJECT_TYPES.COLLEGE }
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
  } catch (error) {
    console.error(error);
  }

  mongoose.disconnect();
}

async function downgrade(): Promise<void> {
  try {
    await dbconnect();

    const sessions = await SessionModel.find({
      type: { $ne: SUBJECT_TYPES.COLLEGE }
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
