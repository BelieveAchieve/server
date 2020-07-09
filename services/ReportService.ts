import moment from 'moment-timezone';
import mongoose from 'mongoose';
import User from '../models/User';
import dbconnect from '../dbutils/dbconnect';

interface SessionReport {
  Topic: string;
  Subtopic: string;
  'Created at': string | Date;
  Messages: string;
  Student: string;
  Volunteer: string;
  'Volunteer join date': string | Date;
  'Ended at': string | Date;
  'Wait time': string;
  'Session rating': string;
}

const formatDate = (date): Date | string => {
  if (!date) return '--';
  return moment(date)
    .tz('America/New_York')
    .format('l h:mm a');
};

// todo:
// allow argument to the session report
// component to search schools
// search bar for studentPartnerOrg
// maybe sesssion range? gte and lte

export const sessionReport = async (): Promise<SessionReport[]> => {
  const oneMinuteInMs = 1000 * 60;
  const roundDecimalPlace = 1;
  const sessionRangeMin = new Date('1/22/20');
  // await dbconnect(mongoose);

  try {
    const sessions = await User.aggregate([
      {
        $match: {
          // approvedHighschool: ObjectId(''),
          studentPartnerOrg: 'btny'
        }
      },
      {
        $project: {
          email: 1,
          pastSessions: 1
        }
      },
      {
        $lookup: {
          from: 'sessions',
          localField: 'pastSessions',
          foreignField: '_id',
          as: 'session'
        }
      },
      {
        $unwind: '$session'
      },
      {
        $match: {
          'session.createdAt': {
            $gte: sessionRangeMin
          }
        }
      },
      {
        $addFields: {
          stringSessionId: { $toString: '$session._id' }
        }
      },
      {
        $lookup: {
          from: 'feedbacks',
          localField: 'stringSessionId',
          foreignField: 'sessionId',
          as: 'feedbacks'
        }
      },
      {
        $addFields: {
          studentFeedback: {
            $filter: {
              input: '$feedbacks',
              as: 'feedback',
              cond: { $eq: ['$$feedback.userType', 'student'] }
            }
          }
        }
      },
      {
        $unwind: {
          path: '$studentFeedback',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 0,
          filteredStuff: 1,
          createdAt: '$session.createdAt',
          topic: '$session.type',
          subtopic: '$session.subTopic',
          messages: { $size: '$session.messages' },
          student: '$email',
          volunteer: {
            $cond: {
              if: '$session.volunteer',
              then: 'YES',
              else: 'NO'
            }
          },
          volunteerJoinedAt: '$session.volunteerJoinedAt',
          endedAt: '$session.endedAt',
          waitTime: {
            $cond: {
              if: '$session.volunteerJoinedAt',
              then: {
                $round: [
                  {
                    $divide: [
                      {
                        $subtract: [
                          '$session.volunteerJoinedAt',
                          '$session.createdAt'
                        ]
                      },
                      oneMinuteInMs
                    ]
                  },
                  roundDecimalPlace
                ]
              },
              else: null
            }
          },
          sessionRating: {
            $cond: {
              if: '$studentFeedback.responseData.rate-session.rating',
              then: '$studentFeedback.responseData.rate-session.rating',
              else: null
            }
          }
        }
      }
    ]);

    const formattedSessions = sessions.map(session => {
      return {
        Topic: session.topic,
        Subtopic: session.subtopic,
        'Created at': formatDate(session.createdAt),
        Messages: session.messages,
        Student: session.student,
        Volunteer: session.volunteer,
        'Volunteer join date': formatDate(session.volunteerJoinedAt),
        'Ended at': formatDate(session.endedAt),
        'Wait time': session.waitTime && `${session.waitTime}mins`,
        'Session rating': session.sessionRating
      };
    });

    console.log(formattedSessions);

    return formattedSessions;
  } catch (error) {
    throw new Error(error);
  }
};

// sessionReport();
