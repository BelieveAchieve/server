import moment from 'moment-timezone';
import mongoose, { Types } from 'mongoose';
import _ from 'lodash';
import User from '../models/User';
import config from '../config';

const ObjectId = mongoose.Types.ObjectId;

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

interface UsageReport {
  'First name': string;
  'Last name': string;
  Email: string;
  'Minutes over date range': number;
  'Total minutes': number;
  'Join date': string | Date;
  'Total sessions': number;
  'Sessions over date range': number;
  'Average session rating': number;
}

const formatDate = (date): Date | string => {
  if (!date) return '--';
  return moment(date)
    .tz('America/New_York')
    .format('l h:mm a');
};

function calcAverageRating(allFeedback): number {
  let ratingsSum = 0;
  let ratingsCount = 0;

  for (let i = 0; i < allFeedback.length; i++) {
    const feedback = allFeedback[i];
    const sessionRating = _.get(
      feedback,
      'responseData.rate-session.rating',
      null
    );
    if (sessionRating) {
      ratingsSum += sessionRating;
      ratingsCount += 1;
    }
  }

  return Number((ratingsSum / (ratingsCount || 1)).toFixed(2));
}

function getOffsetTime(date?): number {
  if (!date) return new Date().getTime();
  const estTimeOffset = 1000 * 60 * 60 * 4;

  return new Date(date).getTime() + estTimeOffset;
}

export const sessionReport = async ({
  sessionRangeFrom,
  sessionRangeTo,
  highSchoolId,
  studentPartnerOrg,
  studentPartnerSite
}): Promise<SessionReport[]> => {
  const query: {
    approvedHighschool?: Types.ObjectId;
    studentPartnerOrg?: string;
    partnerSite?: string;
  } = {};

  if (highSchoolId) query.approvedHighschool = ObjectId(highSchoolId);
  if (studentPartnerOrg) query.studentPartnerOrg = studentPartnerOrg;
  if (studentPartnerSite) query.partnerSite = studentPartnerSite;

  const oneMinuteInMs = 1000 * 60;
  const roundDecimalPlace = 1;
  const oneDayInMS = 1000 * 60 * 60 * 24;

  sessionRangeFrom = getOffsetTime(sessionRangeFrom);
  sessionRangeTo = sessionRangeTo
    ? getOffsetTime(sessionRangeTo) + oneDayInMS
    : getOffsetTime() + oneDayInMS;

  const sessions = await User.aggregate([
    {
      $match: query
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
          $gte: new Date(sessionRangeFrom),
          $lte: new Date(sessionRangeTo)
        }
      }
    },
    {
      $addFields: {
        sessionId: '$session._id'
      }
    },
    {
      $lookup: {
        from: 'feedbacks',
        localField: 'sessionId',
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
    },
    {
      $sort: { createdAt: 1 }
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

  return formattedSessions;
};

export const usageReport = async ({
  joinedBefore,
  joinedAfter,
  sessionRangeFrom,
  sessionRangeTo,
  highSchoolId,
  studentPartnerOrg,
  studentPartnerSite
}): Promise<UsageReport[]> => {
  const query: {
    createdAt?: {};
    approvedHighschool?: Types.ObjectId;
    studentPartnerOrg?: string;
    partnerSite?: string;
  } = {};
  const oneDayInMS = 1000 * 60 * 60 * 24;

  if (joinedAfter) {
    joinedAfter = getOffsetTime(joinedAfter);
    query.createdAt = { $gte: new Date(joinedAfter) };
  }
  if (joinedBefore) {
    joinedBefore = getOffsetTime(joinedBefore) + oneDayInMS;
    query.createdAt = {
      $gte: new Date(joinedAfter),
      $lte: new Date(joinedBefore)
    };
  }

  if (highSchoolId) query.approvedHighschool = ObjectId(highSchoolId);
  if (studentPartnerOrg) query.studentPartnerOrg = studentPartnerOrg;
  if (studentPartnerSite) query.partnerSite = studentPartnerSite;

  // select a range from date and to date or a range from date and today (inclusive)
  sessionRangeFrom = getOffsetTime(sessionRangeFrom);
  sessionRangeTo = sessionRangeTo
    ? getOffsetTime(sessionRangeTo) + oneDayInMS
    : getOffsetTime() + oneDayInMS;

  const students = await User.aggregate([
    {
      $match: query
    },
    {
      $project: {
        email: 1,
        pastSessions: 1,
        firstName: '$firstname',
        lastName: '$lastname',
        createdAt: 1,
        totalSessions: { $size: '$pastSessions' },
        partnerSite: 1,
        approvedHighschool: 1
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
      $unwind: {
        path: '$session',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: 'feedbacks',
        let: { studentId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$userType', 'student'] },
                  { $eq: ['$studentId', '$$studentId'] }
                ]
              }
            }
          }
        ],
        as: 'feedback'
      }
    },
    {
      $addFields: {
        lastMessage: { $arrayElemAt: ['$session.messages', -1] },
        sessionLength: {
          $cond: [
            { $ifNull: ['$session.volunteerJoinedAt', false] },
            { $subtract: ['$session.endedAt', '$session.volunteerJoinedAt'] },
            0
          ]
        }
      }
    },
    {
      $addFields: {
        isWithinDateRange: {
          $cond: [
            {
              $and: [
                {
                  $gte: ['$session.createdAt', new Date(sessionRangeFrom)]
                },
                {
                  $lte: ['$session.createdAt', new Date(sessionRangeTo)]
                }
              ]
            },
            true,
            false
          ]
        },
        sessionLength: {
          $switch: {
            branches: [
              {
                case: {
                  $lt: ['$sessionLength', 0]
                },
                then: 0
              },
              {
                case: {
                  $gte: ['$sessionLength', 60 * (1000 * 60)]
                },
                then: {
                  $cond: [
                    {
                      $ifNull: ['$lastMessage', false]
                    },
                    {
                      $subtract: [
                        '$lastMessage.createdAt',
                        '$session.volunteerJoinedAt'
                      ]
                    },
                    0
                  ]
                }
              }
            ],
            default: '$sessionLength'
          }
        }
      }
    },
    {
      $group: {
        _id: '$_id',
        firstName: { $first: '$firstName' },
        lastName: { $first: '$lastName' },
        createdAt: { $first: '$createdAt' },
        email: { $first: '$email' },
        feedback: { $first: '$feedback' },
        sessionLength: { $sum: '$sessionLength' },
        totalSessions: { $first: '$totalSessions' },
        range: {
          $sum: {
            $cond: [
              { $ifNull: ['$isWithinDateRange', false] },
              '$sessionLength',
              0
            ]
          }
        },
        sessionsOverRange: {
          $sum: {
            $cond: [{ $ifNull: ['$isWithinDateRange', false] }, 1, 0]
          }
        },
        partnerSite: { $first: '$partnerSite' },
        approvedHighschool: { $max: '$approvedHighschool' }
      }
    },
    {
      $project: {
        firstName: 1,
        lastName: 1,
        email: 1,
        joinDate: '$createdAt',
        totalSessions: 1,
        totalMinutes: {
          $round: [{ $divide: ['$sessionLength', 60000] }, 2]
        },
        sessionsOverDateRange: '$sessionsOverRange',
        minsOverDateRange: {
          $round: [{ $divide: ['$range', 60000] }, 2]
        },
        feedback: 1,
        partnerSite: 1,
        approvedHighschool: 1,
        _id: 0
      }
    },
    {
      $sort: {
        joinDate: 1
      }
    }
  ]);

  const partnerSites =
    config.studentPartnerManifests[studentPartnerOrg] &&
    config.studentPartnerManifests[studentPartnerOrg].sites;

  const studentUsage = students.map(student => {
    const feedback = Array.from(student.feedback);

    const dataFormat = {
      'First name': student.firstName,
      'Last name': student.lastName,
      Email: student.email,
      'Join date': formatDate(student.joinDate),
      'Total sessions': student.totalSessions,
      'Total minutes': student.totalMinutes,
      'Average session rating': calcAverageRating(feedback),
      'Sessions over date range': student.sessionsOverDateRange,
      'Minutes over date range': student.minsOverDateRange
    };

    if (partnerSites)
      dataFormat['Partner site'] = student.partnerSite
        ? student.partnerSite
        : '-';

    if (studentPartnerOrg) {
      if (student.approvedHighschool) dataFormat['HS/College'] = 'High school';
      else dataFormat['HS/College'] = 'College';
    }

    return dataFormat;
  });

  return studentUsage;
};
