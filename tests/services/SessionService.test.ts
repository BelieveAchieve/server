import mongoose, { Types } from 'mongoose';
import SessionService from '../../services/SessionService';
import {
  buildMessage,
  buildStudent,
  buildVolunteer,
  buildSession
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
import { Student, Volunteer } from '../types';
import { Message } from '../../models/Message';
import { SESSION_FLAGS, SESSION_REVIEW_STATUS } from '../../constants';
import { convertObjectIdListToStringList } from '../utils';
import WhiteboardService from '../../services/WhiteboardService';
jest.mock('../../services/MailService');
jest.mock('../../services/WhiteboardService');
jest.mock('../../services/QuillDocService');

const buildPastSessions = (): Types.ObjectId[] => {
  const pastSession = buildSession();
  const pastSessions = [pastSession._id];

  return pastSessions;
};

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

describe('calculateHoursTutored', () => {
  const similarTestCases = [
    'Return 0 hours tutored if no volunteer has joined the session',
    'Return 0 hours tutored if no volunteerJoinedAt and no endedAt',
    'Return 0 hours tutored if no messages were sent during the session'
  ];
  for (const testCase of similarTestCases) {
    test(testCase, async () => {
      const { session } = await insertSession();
      const result = await SessionService.calculateHoursTutored(session);
      const expectedHoursTutored = 0;

      expect(result).toEqual(expectedHoursTutored);
    });
  }

  test('Return 0 hours tutored if volunteer joined after session ended', async () => {
    const createdAt = new Date('2020-10-05T12:00:00.000Z');
    const endedAt = new Date('2020-10-05T12:05:00.000Z');
    const volunteerJoinedAt = new Date('2020-10-05T12:10:00.000Z');

    const volunteer = await insertVolunteer();
    const { session } = await insertSession({
      createdAt,
      endedAt,
      volunteerJoinedAt,
      volunteer: volunteer._id,
      messages: buildMessage({
        user: volunteer._id,
        createdAt: new Date('2020-10-05T12:03:00.000Z')
      })
    });

    const result = await SessionService.calculateHoursTutored(session);
    const expectedHoursTutored = 0;

    expect(result).toEqual(expectedHoursTutored);
  });

  test('Return 0 hours tutored if latest message was sent before a volunteer joined', async () => {
    const createdAt = new Date('2020-10-05T12:00:00.000Z');
    const endedAt = new Date('2020-10-05T12:05:00.000Z');
    const volunteerJoinedAt = new Date('2020-10-05T12:10:00.000Z');
    const student = await insertStudent();
    const volunteer = await insertVolunteer();
    const { session } = await insertSession({
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

    const result = await SessionService.calculateHoursTutored(session);
    const expectedHoursTutored = 0;

    expect(result).toEqual(expectedHoursTutored);
  });

  test('Should return amount of hours tutored', async () => {
    const createdAt = new Date('2020-10-05T12:00:00.000Z');
    const endedAt = new Date('2020-10-05T12:05:00.000Z');
    const volunteerJoinedAt = new Date('2020-10-05T12:01:00.000Z');

    const volunteer = await insertVolunteer();
    const { session } = await insertSession({
      createdAt,
      endedAt,
      volunteerJoinedAt,
      volunteer: volunteer._id,
      messages: buildMessage({
        user: volunteer._id,
        createdAt: new Date('2020-10-05T12:03:00.000Z')
      })
    });

    const result = await SessionService.calculateHoursTutored(session);
    const expectedHoursTutored = 0.03;

    expect(result).toEqual(expectedHoursTutored);
  });

  test('Should add hours tutored to user for sessions less than 3 hours', async () => {
    const createdAt = new Date('2020-10-05T11:55:00.000Z');
    const endedAt = new Date('2020-10-06T14:06:00.000Z');
    const volunteerJoinedAt = new Date('2020-10-05T12:00:00.000Z');

    const volunteer = await insertVolunteer();
    const { session } = await insertSessionWithVolunteer({
      createdAt,
      endedAt,
      volunteerJoinedAt,
      volunteer: volunteer._id,
      messages: [
        buildMessage({
          user: volunteer._id,
          createdAt: new Date('2020-10-05T14:05:00.000Z')
        })
      ]
    });

    const hoursTutored = SessionService.calculateHoursTutored(session);
    const expectedHoursTutored = 2.08;
    expect(hoursTutored).toEqual(expectedHoursTutored);
  });

  // When sessions are greater than 3 hours, use the last messages that were sent
  // within a 15 minute window to get an estimate of the session length / hours tutored
  test('Should add hours tutored to user for sessions greater than 3 hours', async () => {
    const createdAt = new Date('2020-10-05T11:55:00.000Z');
    const endedAt = new Date('2020-10-06T16:00:00.000Z');
    const volunteerJoinedAt = new Date('2020-10-05T12:00:00.000Z');

    const volunteer = await insertVolunteer();
    const { session } = await insertSession({
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
          createdAt: new Date('2020-10-05T15:59:00.000Z')
        })
      ]
    });

    const hoursTutored = SessionService.calculateHoursTutored(session);
    const expectedHoursTutored = 3.98;
    expect(hoursTutored).toEqual(expectedHoursTutored);
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
    const expected = [SESSION_FLAGS.FIRST_TIME_STUDENT];
    expect(result).toEqual(expected);
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
    const expected = [SESSION_FLAGS.FIRST_TIME_VOLUNTEER];
    expect(result).toEqual(expected);
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
    const { messages, student, volunteer } = loadMessages({
      studentSentMessages: true,
      volunteerSentMessages: true,
      messagesPerUser: 3
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
    const expected = [SESSION_FLAGS.REPORTED];
    expect(result).toEqual(expected);
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
    await expect(SessionService.endSession('')).rejects.toThrow(expected);
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
      const { messages, student, volunteer } = loadMessages({
        studentSentMessages: true,
        volunteerSentMessages: true,
        messagesPerUser: 20
      });
      await insertStudent(student as Student);
      await insertVolunteer(volunteer as Volunteer);
      const { session } = await insertSession({
        createdAt: new Date(),
        volunteerJoinedAt: new Date(),
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
        reviewStatus: 1,
        reviewStudent: 1,
        reviewVolunteer: 1
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
      expect(updatedSession.reviewStatus).toEqual(
        SESSION_REVIEW_STATUS.NEEDS_REVIEW
      );
    });

    test.todo('Test mock function for QuillDoc was executed');
  });
});
