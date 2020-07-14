import mongoose from 'mongoose';
import User from '../models/User';
import Session from '../models/Session';
import dbconnect from './dbconnect';

export const main = async (): Promise<void> => {
  await dbconnect(mongoose);

  // approx time
  const previousDeploy = new Date('2020-07-05T01:12:23.258+00:00');
  const studentSessionsPipeline = [
    {
      $match: {
        createdAt: { $gte: previousDeploy }
      }
    },
    {
      $project: {
        volunteer: 1,
        student: 1,
        createdAt: 1
      }
    },
    {
      $sort: {
        createdAt: 1
      }
    },
    {
      $group: {
        _id: '$student',
        sessions: { $push: '$_id' }
      }
    }
  ];

  const volunteerSessionsPipeline = [
    {
      $match: {
        createdAt: { $gte: previousDeploy }
      }
    },
    {
      $project: {
        volunteer: 1,
        student: 1,
        createdAt: 1
      }
    },
    {
      $sort: {
        createdAt: 1
      }
    },
    {
      $group: {
        _id: '$volunteer',
        sessions: { $push: '$_id' }
      }
    }
  ];

  try {
    const [result] = await Session.aggregate([
      {
        // Stores two different aggregation pipelines into the properties "studentSessions" and "volunteerSessions"
        $facet: {
          studentSessions: studentSessionsPipeline,
          volunteerSessions: volunteerSessionsPipeline
        }
      }
    ]);

    const updatingStudents = [];
    const updatingVolunteers = [];

    for (const student of result.studentSessions) {
      const { _id, sessions } = student;
      updatingStudents.push(
        User.updateOne(
          { _id },
          { $addToSet: { pastSessions: { $each: sessions } } }
        )
      );
    }

    for (const volunteer of result.volunteerSessions) {
      const { _id, sessions } = volunteer;
      updatingVolunteers.push(
        User.updateOne(
          { _id },
          { $addToSet: { pastSessions: { $each: sessions } } }
        )
      );
    }

    const updatedResult = await Promise.all([
      ...updatingStudents,
      ...updatingVolunteers
    ]);

    console.log(updatedResult);
  } catch (error) {
    console.log(error);
  }

  mongoose.disconnect();
};

main();
