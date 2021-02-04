import mongoose from 'mongoose';
import SessionService from '../../services/SessionService';
import SessionModel from '../../models/Session';
import { Student } from '../../models/Student';
import { Volunteer} from '../../models/Volunteer';
import {
  buildMessage,
  buildStudent,
  buildVolunteer,
  buildSession,
  buildPastSessions,
  generateSentence
} from '../generate';
import {
  insertVolunteer,
  insertSessionWithVolunteer,
  resetDb,
  insertStudent,
  insertSession,
  getStudent,
  getVolunteer,
  getSession
} from '../db-utils';
import { Message } from '../../models/Message';
import { SESSION_FLAGS } from '../../constants';
import { convertObjectIdListToStringList } from '../utils';
import WhiteboardService from '../../services/WhiteboardService';
jest.mock('../../services/MailService');
jest.mock('../../services/WhiteboardService');
jest.mock('../../services/QuillDocService');

/**
 * @todo refactor
 * - some of the test cases are getting too complicated to rely on this function anymore
 *
 * some additional notes:
 * an ABSENT_USER flag gets triggered in some test cases because
 * the volunteerJoinedAt is greater than the createdAt of the messages. refactor to
 * allow an easier way to trigger or not trigger ABSENT_USER or LOW_MESSAGES flags
 */
const loadMessages = ({
  studentSentMessages,
  volunteerSentMessages,
  messagesPerUser = 10,
  studentOverrides = {},
  volunteerOverrides = {}
}): {
  messages: Message[];
  student: Partial<Student>;
  volunteer: Partial<Volunteer>;
} => {
  const messages = [];
  const student = buildStudent({
    pastSessions: buildPastSessions(),
    ...studentOverrides
  });
  const volunteer = buildVolunteer({
    pastSessions: buildPastSessions(),
    ...volunteerOverrides
  });

  for (let i = 0; i < messagesPerUser; i++) {
    if (studentSentMessages)
      messages.push(
        buildMessage({
          user: student._id
        })
      );
    if (volunteerSentMessages)
      messages.push(
        buildMessage({
          user: volunteer._id
        })
      );
  }

  return { messages, student, volunteer };
};

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(async () => {
  await resetDb();
  jest.clearAllMocks();
});

describe('calculateTimeTutored', () => {
  const similarTestCases = [
    'Return 0ms if no volunteer has joined the session',
    'Return 0ms if no volunteerJoinedAt and no endedAt',
    'Return 0ms if no messages were sent during the session'
  ];
  for (const testCase of similarTestCases) {
    test(testCase, async () => {
      const session = buildSession();
      const result = SessionService.calculateTimeTutored(session);
      const expectedTimeTutored = 0;

      expect(result).toEqual(expectedTimeTutored);
    });
  }

  test('Return 0ms if volunteer joined after session ended', () => {
    const createdAt = new Date('2020-10-05T12:00:00.000Z');
    const endedAt = new Date('2020-10-05T12:05:00.000Z');
    const volunteerJoinedAt = new Date('2020-10-05T12:10:00.000Z');
    const volunteer = buildVolunteer();
    const session = buildSession({
      createdAt,
      endedAt,
      volunteerJoinedAt,
      volunteer: volunteer._id,
      messages: buildMessage({
        user: volunteer._id,
        createdAt: new Date('2020-10-05T12:03:00.000Z')
      })
    });

    const result = SessionService.calculateTimeTutored(session);
    const expectedTimeTutored = 0;

    expect(result).toEqual(expectedTimeTutored);
  });

  test('Return 0ms if latest message was sent before a volunteer joined', () => {
    const createdAt = new Date('2020-10-05T12:00:00.000Z');
    const endedAt = new Date('2020-10-05T12:05:00.000Z');
    const volunteerJoinedAt = new Date('2020-10-05T12:10:00.000Z');
    const student = buildStudent();
    const volunteer = buildVolunteer();
    const session = buildSession({
      createdAt,
      endedAt,
      volunteerJoinedAt,
      volunteer: volunteer._id,
      student: student._id,
      messages: buildMessage({
        user: student._id,
        createdAt: new Date('2020-10-05T12:03:00.000Z')
      })
    });

    const result = SessionService.calculateTimeTutored(session);
    const expectedTimeTutored = 0;

    expect(result).toEqual(expectedTimeTutored);
  });

  test('Should return amount of time tutored', () => {
    const createdAt = new Date('2020-10-05T12:00:00.000Z');
    const endedAt = new Date('2020-10-05T12:05:00.000Z');
    const volunteerJoinedAt = new Date('2020-10-05T12:01:00.000Z');
    const lastMessageSentAt = new Date('2020-10-05T12:03:00.000Z');
    const volunteer = buildVolunteer();
    const session = buildSession({
      createdAt,
      endedAt,
      volunteerJoinedAt,
      volunteer: volunteer._id,
      messages: [
        buildMessage({
          user: volunteer._id,
          createdAt: lastMessageSentAt
        })
      ]
    });

    const result = SessionService.calculateTimeTutored(session);
    const expectedTimeTutored =
      lastMessageSentAt.getTime() - volunteerJoinedAt.getTime();

    expect(result).toEqual(expectedTimeTutored);
  });

  test('Should calculate time tutored for sessions less than 3 hours', () => {
    const createdAt = new Date('2020-10-05T11:55:00.000Z');
    const endedAt = new Date('2020-10-06T14:06:00.000Z');
    const volunteerJoinedAt = new Date('2020-10-05T12:00:00.000Z');
    const lastMessageSentAt = new Date('2020-10-05T14:05:00.000Z');
    const volunteer = buildVolunteer();
    const session = buildSession({
      createdAt,
      endedAt,
      volunteerJoinedAt,
      volunteer: volunteer._id,
      messages: [
        buildMessage({
          user: volunteer._id,
          createdAt: lastMessageSentAt
        })
      ]
    });

    const result = SessionService.calculateTimeTutored(session);
    const expectedTimeTutored =
      lastMessageSentAt.getTime() - volunteerJoinedAt.getTime();
    expect(result).toEqual(expectedTimeTutored);
  });

  // When sessions are greater than 3 hours, use the last messages that were sent
  // within a 15 minute window to get an estimate of the session length / hours tutored
  test('Should calculate time tutored for sessions greater than 3 hours', () => {
    const createdAt = new Date('2020-10-05T11:55:00.000Z');
    const endedAt = new Date('2020-10-06T16:00:00.000Z');
    const volunteerJoinedAt = new Date('2020-10-05T12:00:00.000Z');
    const lastMessageSentAt = new Date('2020-10-05T15:59:00.000Z');
    const volunteer = buildVolunteer();
    const session = buildSession({
      createdAt,
      endedAt,
      volunteerJoinedAt,
      volunteer: volunteer._id,
      messages: [
        buildMessage({
          user: volunteer._id,
          createdAt: new Date('2020-10-05T14:05:00.000Z')
        }),
        buildMessage({
          user: volunteer._id,
          createdAt: new Date('2020-10-05T15:58:00.000Z')
        }),
        buildMessage({
          user: volunteer._id,
          createdAt: lastMessageSentAt
        })
      ]
    });

    const result = SessionService.calculateTimeTutored(session);
    const expectedTimeTutored =
      lastMessageSentAt.getTime() - volunteerJoinedAt.getTime();
    expect(result).toEqual(expectedTimeTutored);
  });
});

describe('didParticipantsChat', () => {
  test('Should return true when student and volunteer sent messages back and forth', async () => {
    const { messages, student, volunteer } = loadMessages({
      studentSentMessages: true,
      volunteerSentMessages: true
    });

    const result = SessionService.didParticipantsChat(
      messages,
      student._id,
      volunteer._id
    );
    expect(result).toBeTruthy();
  });

  test('Should return false when only the student sent messages', async () => {
    const { messages, student, volunteer } = loadMessages({
      studentSentMessages: true,
      volunteerSentMessages: false
    });

    const result = SessionService.didParticipantsChat(
      messages,
      student._id,
      volunteer._id
    );
    expect(result).toBeFalsy();
  });

  test('Should return false when only the volunteer sent messages', async () => {
    const { messages, student, volunteer } = loadMessages({
      studentSentMessages: false,
      volunteerSentMessages: true
    });

    const result = SessionService.didParticipantsChat(
      messages,
      student._id,
      volunteer._id
    );
    expect(result).toBeFalsy();
  });

  test('Should return false when no messages were sent', async () => {
    const { messages, student, volunteer } = loadMessages({
      studentSentMessages: false,
      volunteerSentMessages: false,
      messagesPerUser: 0
    });
    const result = SessionService.didParticipantsChat(
      messages,
      student._id,
      volunteer._id
    );
    expect(result).toBeFalsy();
  });
});

describe('getReviewFlags', () => {
  test(`Should trigger ${SESSION_FLAGS.FIRST_TIME_STUDENT} flag for a student's first session`, async () => {
    const { messages, student, volunteer } = loadMessages({
      studentSentMessages: true,
      volunteerSentMessages: true,
      studentOverrides: {
        pastSessions: []
      }
    });

    const { session } = await insertSession({
      createdAt: new Date('2020-10-05T12:03:00.000Z'),
      endedAt: new Date('2020-10-05T14:03:00.000Z'),
      student: student._id,
      volunteer: volunteer._id,
      messages
    });

    const populatedSession = {
      ...session,
      student,
      volunteer
    };

    const result = SessionService.getReviewFlags(populatedSession);
    const expected = SESSION_FLAGS.FIRST_TIME_STUDENT;
    expect(result).toContain(expected);
  });

  test(`Should trigger ${SESSION_FLAGS.FIRST_TIME_VOLUNTEER} flag for a volunteer's first session`, async () => {
    const { messages, student, volunteer } = loadMessages({
      studentSentMessages: true,
      volunteerSentMessages: true,
      messagesPerUser: 13,
      volunteerOverrides: {
        pastSessions: []
      }
    });
    const { session } = await insertSession({
      createdAt: new Date('2020-10-05T12:03:00.000Z'),
      endedAt: new Date('2020-10-05T14:03:00.000Z'),
      student: student._id,
      volunteer: volunteer._id,
      messages
    });
    const populatedSession = {
      ...session,
      student,
      volunteer
    };

    const result = SessionService.getReviewFlags(populatedSession);
    const expected = SESSION_FLAGS.FIRST_TIME_VOLUNTEER;
    expect(result).toContain(expected);
  });

  test(`Should trigger ${SESSION_FLAGS.UNMATCHED} flag when a volunter does not join the session`, async () => {
    const { messages, student } = loadMessages({
      studentSentMessages: false,
      volunteerSentMessages: false,
      messagesPerUser: 0
    });
    const { session } = await insertSession({
      createdAt: new Date('2020-10-05T12:03:00.000Z'),
      endedAt: new Date('2020-10-05T14:03:00.000Z'),
      student: student._id,
      messages
    });
    const populatedSession = {
      ...session,
      student
    };

    const result = SessionService.getReviewFlags(populatedSession);
    const expected = [SESSION_FLAGS.UNMATCHED];
    expect(result).toEqual(expected);
  });

  test(`Should trigger ${SESSION_FLAGS.LOW_MESSAGES} flag`, async () => {
    const student = buildStudent({ pastSessions: buildPastSessions() });
    const volunteer = buildVolunteer({ pastSessions: buildPastSessions() });
    const volunteerJoinedAt = new Date('2020-10-05T12:03:30.000Z');

    const messages = [
      { user: student._id, createdAt: new Date('2020-10-05T12:04:30.000Z') },
      { user: volunteer._id, createdAt: new Date('2020-10-05T12:05:30.000Z') }
    ];

    const { session } = await insertSession({
      createdAt: new Date('2020-10-05T12:03:00.000Z'),
      endedAt: new Date('2020-10-05T14:03:00.000Z'),
      student: student._id,
      volunteer,
      messages,
      volunteerJoinedAt
    });

    const populatedSession = {
      ...session,
      student,
      volunteer
    };

    const result = SessionService.getReviewFlags(populatedSession);
    const expected = [SESSION_FLAGS.LOW_MESSAGES];
    expect(result).toEqual(expected);
  });

  test(`Should trigger ${SESSION_FLAGS.ABSENT_USER} flag when only one user sends messages`, async () => {
    const { messages, student, volunteer } = loadMessages({
      studentSentMessages: true,
      volunteerSentMessages: false,
      messagesPerUser: 10
    });
    const { session } = await insertSession({
      createdAt: new Date('2020-10-05T12:03:00.000Z'),
      endedAt: new Date('2020-10-05T14:03:00.000Z'),
      student: student._id,
      volunteer,
      messages
    });
    const populatedSession = {
      ...session,
      student,
      volunteer
    };

    const result = SessionService.getReviewFlags(populatedSession);
    const expected = [SESSION_FLAGS.ABSENT_USER];
    expect(result).toEqual(expected);
  });

  test(`Should trigger ${SESSION_FLAGS.ABSENT_USER} flag when no user sends messages`, async () => {
    const { messages, student, volunteer } = loadMessages({
      studentSentMessages: false,
      volunteerSentMessages: false,
      messagesPerUser: 0
    });
    const { session } = await insertSession({
      createdAt: Date.now(),
      endedAt: Date.now(),
      student: student._id,
      volunteer,
      messages
    });
    const populatedSession = {
      ...session,
      student,
      volunteer
    };

    const result = SessionService.getReviewFlags(populatedSession);
    const expected = [SESSION_FLAGS.ABSENT_USER];
    expect(result).toEqual(expected);
  });

  test(`Should trigger ${SESSION_FLAGS.REPORTED} flag when a session was reported`, async () => {
    const { messages, student, volunteer } = loadMessages({
      studentSentMessages: true,
      volunteerSentMessages: true,
      messagesPerUser: 20
    });
    const { session } = await insertSession({
      createdAt: new Date('2020-10-05T12:03:00.000Z'),
      endedAt: Date.now(),
      student: student._id,
      volunteer,
      messages,
      isReported: true
    });
    const populatedSession = {
      ...session,
      student,
      volunteer
    };

    const result = SessionService.getReviewFlags(populatedSession);
    const expected = SESSION_FLAGS.REPORTED;
    expect(result).toContain(expected);
  });
});

describe('getFeedbackFlags', () => {
  test(`Should add ${SESSION_FLAGS.STUDENT_RATING} flag when student leaves a feedback rating with <= 3`, () => {
    const feedback = {
      'coach-rating': 1,
      'session-goal': 4
    };
    const result = SessionService.getFeedbackFlags(feedback);
    const expected = [SESSION_FLAGS.STUDENT_RATING];
    expect(result).toEqual(expected);
  });

  test(`Should not add ${SESSION_FLAGS.STUDENT_RATING} flag when student leaves feedback ratings > 3`, () => {
    const feedback = {
      'coach-rating': 4,
      'session-goal': 4
    };
    const result = SessionService.getFeedbackFlags(feedback);
    const expected = [];
    expect(result).toEqual(expected);
  });
  test(`Should add ${SESSION_FLAGS.VOLUNTEER_RATING} flag when volunteer leaves a feedback rating with <= 3`, () => {
    const feedback = {
      'rate-session': {
        rating: 2
      },
      'session-experience': {
        'easy-to-answer-questions': 1,
        'feel-like-helped-student': 4,
        'feel-more-fulfilled': 3,
        'good-use-of-time': 1,
        'plan-on-volunteering-again': 1
      }
    };
    const result = SessionService.getFeedbackFlags(feedback);
    const expected = [SESSION_FLAGS.VOLUNTEER_RATING];
    expect(result).toEqual(expected);
  });
  test(`Should not add ${SESSION_FLAGS.VOLUNTEER_RATING} flag when student leaves feedback ratings > 3`, () => {
    const feedback = {
      'rate-session': {
        rating: 5
      }
    };
    const result = SessionService.getFeedbackFlags(feedback);
    const expected = [];
    expect(result).toEqual(expected);
  });

  test(`Should add ${SESSION_FLAGS.COMMENT} flag when user leaves a comment`, () => {
    const comment = generateSentence();
    const feedback = {
      'other-feedback': comment
    };
    const result = SessionService.getFeedbackFlags(feedback);
    const expected = [SESSION_FLAGS.COMMENT];
    expect(result).toEqual(expected);
  });
});

describe('addFeedbackFlags', () => {
  test('Should add student feedback flags to the session and set studentReviewed to false', async () => {
    const { session } = await insertSessionWithVolunteer({
      endedAt: Date.now(),
      flags: [SESSION_FLAGS.FIRST_TIME_STUDENT],
      reviewedStudent: true
    });
    const flags = [SESSION_FLAGS.COMMENT, SESSION_FLAGS.STUDENT_RATING];
    const input = {
      sessionId: session._id,
      flags
    };
    await SessionService.addFeedbackFlags(input);
    const updatedSession = await getSession(
      { _id: input.sessionId },
      {
        flags: 1,
        reviewedStudent: 1
      }
    );
    const expectedFlags = [SESSION_FLAGS.FIRST_TIME_STUDENT, ...flags];
    expect(updatedSession.flags).toEqual(expectedFlags);
    expect(updatedSession.reviewedStudent).toBeFalsy();
  });

  test('Should add volunteer feedback flags to the session and set reviewedVolunteer to false', async () => {
    const { session } = await insertSessionWithVolunteer({
      endedAt: Date.now(),
      flags: [SESSION_FLAGS.REPORTED],
      isReported: true
    });
    const flags = [SESSION_FLAGS.VOLUNTEER_RATING];
    const input = {
      sessionId: session._id,
      flags
    };
    await SessionService.addFeedbackFlags(input);
    const updatedSession = await getSession(
      { _id: input.sessionId },
      {
        flags: 1,
        reviewedVolunteer: 1
      }
    );
    const expectedFlags = [SESSION_FLAGS.REPORTED, ...flags];
    expect(updatedSession.flags).toEqual(expectedFlags);
    expect(updatedSession.reviewedVolunteer).toBeFalsy();
  });

  test('Should not add feedback flags to the session', async () => {
    const { session } = await insertSessionWithVolunteer({
      endedAt: Date.now(),
      flags: [SESSION_FLAGS.FIRST_TIME_STUDENT],
      reviewedStudent: true
    });
    const flags = [];
    const input = {
      sessionId: session._id,
      userType: 'student',
      flags
    };
    await SessionService.addFeedbackFlags(input);
    const updatedSession = await getSession(
      { _id: input.sessionId },
      {
        flags: 1
      }
    );
    const expectedFlags = [SESSION_FLAGS.FIRST_TIME_STUDENT];
    expect(updatedSession.flags).toEqual(expectedFlags);
  });
});

describe('endSession', () => {
  test('Should throw no session found when cannot find the session', async () => {
    const expected = 'No session found';
    const session = buildSession();
    const input = {
      sessionId: session._id
    };
    await expect(SessionService.endSession(input)).rejects.toThrow(expected);
  });

  test('Should early exit when ending a session that already ended', async () => {
    const { session } = await insertSession({
      endedAt: Date.now()
    });
    const input = {
      sessionId: session._id
    };

    const result = await SessionService.endSession(input);
    expect(result).toBeUndefined();
  });

  test('Should throw error when a user who was not part of the session tries to end it', async () => {
    const { session } = await insertSessionWithVolunteer();
    const outsideStudent = buildStudent();
    const outsideVolunteer = buildVolunteer();
    const inputOne = {
      sessionId: session._id,
      isAdmin: false,
      endedBy: outsideStudent
    };
    const inputTwo = {
      sessionId: session._id,
      isAdmin: false,
      endedBy: outsideVolunteer
    };

    const expected = 'Only session participants can end a session';
    await expect(SessionService.endSession(inputOne)).rejects.toThrow(expected);
    await expect(SessionService.endSession(inputTwo)).rejects.toThrow(expected);
  });

  describe('Should end session successfully', () => {
    test('Should add session to past sessions for student', async () => {
      const { session, student } = await insertSession();
      expect(student.pastSessions.length).toEqual(0);

      const input = {
        sessionId: session._id,
        endedBy: student
      };

      await SessionService.endSession(input);
      const updatedSession = await getSession({
        _id: session._id
      });

      const queryProjection = { pastSessions: 1 };
      const updatedStudent = await getStudent(
        { _id: student._id },
        queryProjection
      );
      const updatedStudentPastSessions = convertObjectIdListToStringList(
        updatedStudent.pastSessions
      );

      expect(WhiteboardService.getDoc).toHaveBeenCalledTimes(1);
      expect(WhiteboardService.deleteDoc).toHaveBeenCalledTimes(1);
      expect(updatedStudent.pastSessions.length).toEqual(1);
      expect(updatedStudentPastSessions).toContain(session._id.toString());
      expect(updatedSession.endedAt).toBeTruthy();
    });

    // eslint-disable-next-line quotes
    test("Should add session to past sessions for student and volunteer and update volunteer's hoursTutored", async () => {
      const volunteer = await insertVolunteer();
      const student = await insertStudent();
      const oneHourAgo = Date.now() - 1000 * 60 * 60 * 1;
      const createdAt = new Date(oneHourAgo);
      const volunteerJoinedAt = new Date(oneHourAgo + 1000 * 60);
      const { session } = await insertSession({
        student: student._id,
        createdAt,
        volunteerJoinedAt,
        volunteer: volunteer._id,
        messages: [
          buildMessage({
            user: volunteer._id,
            createdAt: new Date()
          }),
          buildMessage({
            user: student._id,
            createdAt: new Date()
          })
        ]
      });
      const hoursTutored = volunteer.hoursTutored.toString();
      expect(student.pastSessions.length).toEqual(0);
      expect(volunteer.pastSessions.length).toEqual(0);
      expect(Number(hoursTutored)).toEqual(0);

      const input = {
        sessionId: session._id,
        endedBy: student
      };
      await SessionService.endSession(input);
      const updatedSession = await getSession({
        _id: session._id
      });

      const updatedStudent = await getStudent(
        { _id: student._id },
        { pastSessions: 1 }
      );
      const updatedVolunteer = await getVolunteer(
        { _id: volunteer._id },
        { pastSessions: 1, hoursTutored: 1 }
      );
      const updatedStudentPastSessions = convertObjectIdListToStringList(
        updatedStudent.pastSessions
      );
      const updatedVolunteerPastSessions = convertObjectIdListToStringList(
        updatedVolunteer.pastSessions
      );
      const updatedHoursTutored = updatedVolunteer.hoursTutored.toString();
      expect(WhiteboardService.getDoc).toHaveBeenCalledTimes(1);
      expect(WhiteboardService.deleteDoc).toHaveBeenCalledTimes(1);
      expect(updatedStudent.pastSessions.length).toEqual(1);
      expect(updatedVolunteer.pastSessions.length).toEqual(1);
      expect(updatedStudentPastSessions).toContain(session._id.toString());
      expect(updatedVolunteerPastSessions).toContain(session._id.toString());
      expect(Number(updatedHoursTutored)).toBeGreaterThan(0);
      expect(updatedSession.endedAt).toBeTruthy();
    });

    test('Should not add session review flags to the session', async () => {
      const oneHourAgo = Date.now() - 1000 * 60 * 60 * 1;
      const createdAt = new Date(oneHourAgo);
      const volunteerJoinedAt = new Date(oneHourAgo + 1000 * 60);
      const { messages, student, volunteer } = loadMessages({
        studentSentMessages: true,
        volunteerSentMessages: true,
        messagesPerUser: 20
      });

      // avoid LOW_MESSAGES flag by having the createdAt of the messages greater
      // than the volunteerJoinedAt date
      const updatedMessages = [];
      for (const message of messages) {
        updatedMessages.push({ ...message, createdAt: new Date(oneHourAgo) });
      }

      await insertStudent(student);
      await insertVolunteer(volunteer);
      const { session } = await insertSession({
        createdAt,
        volunteerJoinedAt,
        student: student._id,
        volunteer: volunteer._id,
        messages: messages
      });

      const input = {
        sessionId: session._id,
        endedBy: volunteer
      };
      await SessionService.endSession(input);
      const updatedSession = await getSession(
        {
          _id: session._id
        },
        { flags: 1 }
      );
      expect(updatedSession.flags.length).toEqual(0);
    });

    test('Should add session review flags to the session', async () => {
      const volunteer = await insertVolunteer();
      const oneHourAgo = Date.now() - 1000 * 60 * 60 * 1;
      const createdAt = new Date(oneHourAgo);
      const volunteerJoinedAt = new Date(oneHourAgo + 1000 * 60);
      const { session, student } = await insertSession({
        createdAt,
        volunteerJoinedAt,
        volunteer: volunteer._id,
        messages: [
          buildMessage({
            user: volunteer._id,
            createdAt: new Date()
          }),
          buildMessage({
            user: volunteer._id,
            createdAt: new Date()
          })
        ],
        isReported: true
      });

      const input = {
        sessionId: session._id,
        endedBy: student
      };
      await SessionService.endSession(input);
      const projection = {
        flags: 1,
        reviewedStudent: 1,
        reviewedVolunteer: 1
      };
      const updatedSession = await getSession(
        {
          _id: session._id
        },
        projection
      );

      const expectedFlags = [
        SESSION_FLAGS.ABSENT_USER,
        SESSION_FLAGS.FIRST_TIME_VOLUNTEER,
        SESSION_FLAGS.REPORTED,
        SESSION_FLAGS.FIRST_TIME_STUDENT
      ];

      expect(updatedSession.flags).toEqual(expectedFlags);
      expect(updatedSession.reviewedStudent).toBeFalsy();
      expect(updatedSession.reviewedVolunteer).toBeFalsy();
    });

    test('Should ignore session flags that do not trigger a review', async () => {
      const { messages, student, volunteer } = loadMessages({
        studentSentMessages: true,
        volunteerSentMessages: false,
        messagesPerUser: 5
      });
      await insertStudent(student);
      await insertVolunteer(volunteer);
      const oneHourAgo = Date.now() - 1000 * 60 * 60 * 1;
      const createdAt = new Date(oneHourAgo);
      const volunteerJoinedAt = new Date(oneHourAgo + 1000 * 60);
      const { session } = await insertSession({
        createdAt,
        student: student._id,
        volunteerJoinedAt,
        volunteer: volunteer._id,
        messages
      });

      const input = {
        sessionId: session._id,
        endedBy: student._id
      };
      await SessionService.endSession(input);
      const projection = {
        flags: 1,
        reviewedStudent: 1,
        reviewedVolunteer: 1
      };
      const updatedSession = await getSession(
        {
          _id: session._id
        },
        projection
      );

      const expectedFlags = [SESSION_FLAGS.ABSENT_USER];

      expect(updatedSession.flags).toEqual(expectedFlags);
      expect(updatedSession.reviewedStudent).toBeUndefined();
      expect(updatedSession.reviewedVolunteer).toBeUndefined();
    });

    test.todo('Test mock function for QuillDoc was executed');
  });
});

describe('getTimeTutoredForDateRange', () => {
  test('Should get the total time tutored over a date range', async () => {
    const { _id: volunteerId } = buildVolunteer();
    const timeTutoredOneMin = 60000;
    const timeTutoredTwoMins = 120000;
    await SessionModel.insertMany([
      buildSession({
        createdAt: new Date('12/10/2020'),
        volunteer: volunteerId,
        timeTutored: timeTutoredOneMin
      }),
      buildSession({
        createdAt: new Date('12/14/2020'),
        volunteer: volunteerId,
        timeTutored: timeTutoredTwoMins
      }),
      buildSession({
        createdAt: new Date('12/21/2020'),
        volunteer: volunteerId,
        timeTutored: timeTutoredOneMin
      }),
      buildSession({
        createdAt: new Date('12/25/2020'),
        volunteer: volunteerId,
        timeTutored: timeTutoredTwoMins
      })
    ]);

    const fromDate = new Date('12/13/2020');
    const toDate = new Date('12/25/2020');

    const timeTutored = await SessionService.getTimeTutoredForDateRange(
      volunteerId,
      fromDate,
      toDate
    );
    const expectedTimeTutored =
      timeTutoredOneMin + timeTutoredTwoMins + timeTutoredTwoMins;
    expect(timeTutored).toEqual(expectedTimeTutored);
  });
});

describe('getMessagesAfterDate', () => {
  test('Should return messages after a given date', async () => {
    const student = buildStudent();
    const volunteer = buildVolunteer();
    const volunteerJoinedAt = new Date('2021-01-14T12:00:00.000Z');
    const messages = [
      buildMessage({
        user: student._id,
        createdAt: new Date('2021-01-14T11:45:00.000Z')
      }),
      buildMessage({
        user: student._id,
        createdAt: new Date('2021-01-14T11:55:00.000Z')
      }),
      buildMessage({
        user: student._id,
        createdAt: new Date('2021-01-14T12:00:00.000Z')
      }),
      buildMessage({
        user: volunteer._id,
        createdAt: new Date('2021-01-14T12:10:00.000Z')
      }),
      buildMessage({
        user: student._id,
        createdAt: new Date('2021-01-14T12:15:00.000Z')
      })
    ];

    const results = SessionService.getMessagesAfterDate(
      messages,
      volunteerJoinedAt
    );
    expect(results).toHaveLength(3);
  });

  test('Should return an empty array if no messages were sent', async () => {
    const volunteerJoinedAt = new Date('2021-01-14T12:00:00.000Z');
    const messages = [];

    const results = SessionService.getMessagesAfterDate(
      messages,
      volunteerJoinedAt
    );

    expect(results).toHaveLength(0);
  });

  test('Should return an empty array if no date is provided', async () => {
    const student = buildStudent();
    const volunteer = buildVolunteer();

    const messages = [
      buildMessage({
        user: student._id,
        createdAt: new Date('2021-01-14T11:45:00.000Z')
      }),
      buildMessage({
        user: student._id,
        createdAt: new Date('2021-01-14T11:55:00.000Z')
      }),
      buildMessage({
        user: student._id,
        createdAt: new Date('2021-01-14T12:00:00.000Z')
      }),
      buildMessage({
        user: volunteer._id,
        createdAt: new Date('2021-01-14T12:10:00.000Z')
      }),
      buildMessage({
        user: student._id,
        createdAt: new Date('2021-01-14T12:15:00.000Z')
      })
    ];

    const results = SessionService.getMessagesAfterDate(messages);
    expect(results).toHaveLength(0);
  });
});
