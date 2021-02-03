import mongoose from 'mongoose';
import Feedback from '../models/Feedback';
import dbconnect from './dbconnect';
const ObjectId = require('mongodb').ObjectId;

async function upgrade(): Promise<void> {
  try {
    await dbconnect();
    const allFeedback = await Feedback.find()
      .lean()
      .exec();

    const pendingUpdates = [];

    for (const feedback of allFeedback) {
      const { studentId, volunteerId, sessionId, _id } = feedback;
      const update: any = {};
      if (studentId) update.studentId = ObjectId(studentId);
      if (volunteerId) update.volunteerId = ObjectId(volunteerId);
      if (sessionId) update.sessionId = ObjectId(sessionId);

      pendingUpdates.push(Feedback.updateOne({ _id }, update));
    }

    const result = await Promise.all(pendingUpdates)

    console.log(result);
  } catch (error) {
    console.log('error', error);
  }

  mongoose.disconnect();
}

async function downgrade(): Promise<void> {
  try {
    await dbconnect();
    const allFeedback = await Feedback.find()
      .lean()
      .exec();

    const pendingUpdates = [];

    for (const feedback of allFeedback) {
      const { studentId, volunteerId, sessionId, _id } = feedback;
      console.log(studentId.toString())
      const update: any = {};
      if (studentId) update.studentId = studentId.toString();
      if (volunteerId) update.volunteerId = studentId.toString();
      if (sessionId) update.sessionId = studentId.toString();

      pendingUpdates.push(Feedback.updateOne({ _id }, update));
    }

    const result = await Promise.all(pendingUpdates)

    console.log(result);
  } catch (error) {
    console.log('error', error);
  }

  mongoose.disconnect();
}

// To downgrade the migration run:
// DOWNGRADE=true npx ts-node dbutils/migrate-feedback-refs.ts
if (process.env.DOWNGRADE) {
  downgrade();
} else {
  // npx ts-node dbutils/migrate-feedback-refs.ts
  upgrade();
}
