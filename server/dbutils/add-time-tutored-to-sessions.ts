import mongoose from 'mongoose';
import dbconnect from './dbconnect';
import SessionModel from '../models/Session';
import { calculateTimeTutored } from '../services/SessionService';

// Add timeTutored to sessions
async function upgrade(): Promise<void> {
  try {
    await dbconnect();

    const sessions = await SessionModel.find({
      endedAt: { $exists: true }
    })
      .sort({ createdAt: -1 })
      .select({ whiteboardDoc: 0, quillDoc: 0 })
      .lean()
      .exec();
    const updates = [];
    for (const session of sessions) {
      // older sessions with a `volunteer` but no `volunteerJoinedAt` will return NaN
      const timeTutored = calculateTimeTutored(session);

      updates.push(
        SessionModel.updateOne(
          {
            _id: session._id
          },
          {
            timeTutored: isNaN(timeTutored) ? 0 : timeTutored
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

// Remove timeTutored from sessions
async function downgrade(): Promise<void> {
  try {
    await dbconnect();

    const results = await SessionModel.updateMany(
      {},
      {
        $unset: {
          timeTutored: ''
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
// DOWNGRADE=true npx ts-node dbutils/add-time-tutored-to-sessions.ts
if (process.env.DOWNGRADE) {
  downgrade();
} else {
  upgrade();
}
