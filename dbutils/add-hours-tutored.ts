import mongoose from 'mongoose';
import VolunteerModel from '../models/Volunteer';
import dbconnect from './dbconnect';
import Session from '../models/Session';

const calculateHoursTutored = async userId => {
  const pastSessions = await Session.find({ volunteer: userId })
    .sort({ endedAt: 1 })
    .select('volunteerJoinedAt endedAt messages')
    .lean()
    .exec();
  const threeHoursMs = 1000 * 60 * 60 * 3;
  const fifteenMinsMs = 1000 * 60 * 15;

  const millisecondsTutored = pastSessions.reduce((totalMs, session) => {
    const { volunteerJoinedAt, endedAt, messages } = session;

    if (!(volunteerJoinedAt && endedAt)) return totalMs;
    // skip if no messages are sent
    if (messages.length === 0) return totalMs;

    const volunteerJoinDate = new Date(volunteerJoinedAt);
    const sessionEndDate = new Date(endedAt);
    let sessionLengthMs =
      (new Date(sessionEndDate).getTime() as number) -
      (new Date(volunteerJoinDate).getTime() as number);

    // skip if volunteer joined after the session ended
    if (sessionLengthMs < 0) return totalMs;

    let latestMessageIndex = messages.length - 1;
    let wasMessageSentAfterSessionEnded =
      messages[latestMessageIndex].createdAt > sessionEndDate;

    // get the latest message that was sent within a 15 minute window of the message prior.
    // Sometimes sessions are not ended by either participant and one of the participants may send
    // a message to see if the other participant is still active before ending the session.
    // Exclude these messages when getting the total session end time
    if (sessionLengthMs > threeHoursMs || wasMessageSentAfterSessionEnded) {
      while (
        latestMessageIndex > 0 &&
        (wasMessageSentAfterSessionEnded ||
          messages[latestMessageIndex].createdAt -
            messages[latestMessageIndex - 1].createdAt >
            fifteenMinsMs)
      ) {
        latestMessageIndex--;
        wasMessageSentAfterSessionEnded =
          messages[latestMessageIndex].createdAt > sessionEndDate;
      }
    }

    const latestMessageDate = new Date(messages[latestMessageIndex].createdAt);

    // skip if the latest message was sent before a volunteer joined
    // or skip if the only messages that were sent were after a session has ended
    if (
      latestMessageDate <= volunteerJoinDate ||
      wasMessageSentAfterSessionEnded
    )
      return totalMs;
    sessionLengthMs =
      (new Date(latestMessageDate).getTime() as number) -
      (new Date(volunteerJoinDate).getTime() as number);

    return sessionLengthMs + totalMs;
  }, 0);

  // milliseconds in an hour = (60,000 * 60) = 3,600,000
  const hoursTutored = Number(millisecondsTutored / 3600000).toFixed(2);
  return hoursTutored;
};

async function upgrade(): Promise<void> {
  try {
    await dbconnect();

    const volunteers = await VolunteerModel.find({})
      .lean()
      .exec();
    const pendingUpdates = [];
    for (const v of volunteers) {
      const hoursTutored = await calculateHoursTutored(v._id);
      pendingUpdates.push(
        VolunteerModel.updateOne({ _id: v._id }, { hoursTutored })
      );
    }
    const results = await Promise.all(pendingUpdates)
    console.log('The results: ', results)
  } catch (error) {
    console.log('error', error);
  }


  mongoose.disconnect();
}

async function downgrade(): Promise<void> {
  try {
    await dbconnect();
    const results = await VolunteerModel.updateMany(
      { isVolunteer: true },
      {
        $unset: {
          hoursTutored: ''
        }
      }
    );
    console.log(results);
  } catch (error) {
    console.error(error);
  }

  mongoose.disconnect();
}

// To run migration:
// npx ts-node dbutils/add-hours-tutored.ts

// To downgrade the migration run:
// DOWNGRADE=true npx ts-node dbutils/add-hours-tutored.ts
if (process.env.DOWNGRADE) {
  downgrade();
} else {
  upgrade();
}
