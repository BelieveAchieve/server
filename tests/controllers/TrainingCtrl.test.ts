import mongoose from 'mongoose';
import TrainingCtrl from '../../controllers/TrainingCtrl';
import { resetDb, insertVolunteer, getVolunteer } from '../utils/db-utils';
import { buildCertifications, buildVolunteer } from '../utils/generate';
import {
  SUBJECTS,
  TRAINING,
  MATH_CERTS,
  SAT_CERTS,
  SCIENCE_CERTS,
  MATH_SUBJECTS,
  USER_ACTION
} from '../../constants';
import Question from '../../models/Question';
import algebraQuestions from '../../seeds/questions/algebra.json';
import { Certifications } from '../utils/types';
import UserActionModel from '../../models/UserAction';

const buildCertificationsWithUpchieve101 = (options = {}): Certifications => {
  return buildCertifications({
    [TRAINING.UPCHIEVE_101]: { passed: true, tries: 1 },
    ...options
  });
};

// A helper that returns an answer map with the amount of wrong answers entered
const generateIdAnswerMapHelper = async (
  incorrectAnswerAmount = 0
): Promise<{ [id: string]: string }> => {
  // Only get 12 questions
  const questions = await Question.find({})
    .lean()
    .limit(12)
    .exec();

  const idAnswerList = questions.map(question => {
    const data = {};
    const questionId = question._id;
    data[questionId] = question.correctAnswer;

    return data;
  });

  const idAnswerMap = {};

  for (let i = 0; i < idAnswerList.length; i++) {
    const questionId = Object.keys(idAnswerList[i])[0];
    const correctAnswer = idAnswerList[i][questionId];

    // convert to ASCII and increment then convert back to char to get a wrong answer
    if (i < incorrectAnswerAmount)
      idAnswerMap[questionId] = String.fromCharCode(
        correctAnswer.charCodeAt(0) + 1
      );
    else idAnswerMap[questionId] = correctAnswer;
  }

  return idAnswerMap;
};

// db connection
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
});

describe('getQuizScore', () => {
  beforeAll(async () => {
    await Question.insertMany(algebraQuestions);
  });

  test('Should onboard a user after completing a math certification, then UPchieve 101, and then Tutoring Skills', async () => {
    const volunteer = await insertVolunteer(
      buildVolunteer({ availabilityLastModifiedAt: new Date() })
    );

    // Volunteer completes a quiz in Statistics
    const idAnswerMap = await generateIdAnswerMapHelper();
    // @todo: figure out how to set a type for quizScoreInput
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let quizScoreInput: any = {
      user: volunteer,
      category: MATH_CERTS.STATISTICS,
      idAnswerMap
    };

    let result = await TrainingCtrl.getQuizScore(quizScoreInput);
    let updatedVolunteer = await getVolunteer({ _id: volunteer._id });
    let expectedResult = {
      tries: 1,
      passed: true
    };
    expect(result).toMatchObject(expectedResult);
    expect(updatedVolunteer.isOnboarded).toBeFalsy();
    expect(
      updatedVolunteer.certifications[MATH_CERTS.STATISTICS].passed
    ).toBeTruthy();

    // Volunteer then completes UPchieve 101
    quizScoreInput = {
      user: updatedVolunteer,
      category: TRAINING.UPCHIEVE_101,
      idAnswerMap
    };

    result = await TrainingCtrl.getQuizScore(quizScoreInput);
    updatedVolunteer = await getVolunteer({ _id: volunteer._id });
    expectedResult = {
      tries: 1,
      passed: true
    };

    expect(result).toMatchObject(expectedResult);
    expect(updatedVolunteer.isOnboarded).toBeTruthy();
    expect(
      updatedVolunteer.certifications[TRAINING.UPCHIEVE_101].passed
    ).toBeTruthy();

    // Volunteer then completes required training for math, Tutoring Skills, to become onboarded
    // @note: Leave commented out until Tutoring Skills course is added
    // quizScoreInput = {
    //   user: updatedVolunteer,
    //   category: TRAINING.TUTORING_SKILLS,
    //   idAnswerMap
    // };

    // result = await TrainingCtrl.getQuizScore(quizScoreInput);
    // updatedVolunteer = await getVolunteer({ _id: volunteer._id });
    // expectedResult = {
    //   tries: 1,
    //   passed: true
    // };

    // expect(result).toMatchObject(expectedResult);
    // expect(updatedVolunteer.isOnboarded).toBeTruthy();
    // expect(
    //   updatedVolunteer.certifications[TRAINING.TUTORING_SKILLS].passed
    // ).toBeTruthy();
  });
  test('Should onboard a user after completing Tutoring Skills, then a math certification, and then UPchieve 101', async () => {
    const volunteer = await insertVolunteer(
      buildVolunteer({ availabilityLastModifiedAt: new Date() })
    );
    // Volunteer first completes required training for Math and Science - Tutoring Skills
    const idAnswerMap = await generateIdAnswerMapHelper();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let quizScoreInput: any = {
      user: volunteer,
      category: TRAINING.TUTORING_SKILLS,
      idAnswerMap
    };

    let result = await TrainingCtrl.getQuizScore(quizScoreInput);
    let updatedVolunteer = await getVolunteer({ _id: volunteer._id });
    let expectedResult = {
      tries: 1,
      passed: true
    };
    expect(result).toMatchObject(expectedResult);
    expect(updatedVolunteer.isOnboarded).toBeFalsy();
    expect(
      updatedVolunteer.certifications[TRAINING.TUTORING_SKILLS].passed
    ).toBeTruthy();

    // Volunteer completes a second course
    quizScoreInput = {
      user: updatedVolunteer,

      category: SCIENCE_CERTS.PHYSICS_TWO,
      idAnswerMap
    };

    result = await TrainingCtrl.getQuizScore(quizScoreInput);
    updatedVolunteer = await getVolunteer({ _id: volunteer._id });

    expectedResult = {
      tries: 1,
      passed: true
    };
    expect(result).toMatchObject(expectedResult);
    expect(updatedVolunteer.isOnboarded).toBeFalsy();
    expect(
      updatedVolunteer.certifications[SCIENCE_CERTS.PHYSICS_TWO].passed
    ).toBeTruthy();

    // Volunteer then completes UPchieve 101
    quizScoreInput = {
      user: updatedVolunteer,
      category: TRAINING.UPCHIEVE_101,
      idAnswerMap
    };

    result = await TrainingCtrl.getQuizScore(quizScoreInput);
    updatedVolunteer = await getVolunteer({ _id: volunteer._id });

    expectedResult = {
      tries: 1,
      passed: true
    };
    expect(result).toMatchObject(expectedResult);
    expect(updatedVolunteer.isOnboarded).toBeTruthy();
    expect(
      updatedVolunteer.certifications[TRAINING.UPCHIEVE_101].passed
    ).toBeTruthy();
  });
  test('Should onboard a user after completing UPchieve 101, then Tutoring Skills, and then a math certification', async () => {
    const volunteer = await insertVolunteer(
      buildVolunteer({ availabilityLastModifiedAt: new Date() })
    );

    // Volunteer completes UPchieve 101
    const idAnswerMap = await generateIdAnswerMapHelper();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let quizScoreInput: any = {
      user: volunteer,
      category: TRAINING.UPCHIEVE_101,
      idAnswerMap
    };

    let result = await TrainingCtrl.getQuizScore(quizScoreInput);
    let updatedVolunteer = await getVolunteer({ _id: volunteer._id });
    let expectedResult = {
      tries: 1,
      passed: true
    };
    expect(result).toMatchObject(expectedResult);
    expect(updatedVolunteer.isOnboarded).toBeFalsy();
    expect(
      updatedVolunteer.certifications[TRAINING.UPCHIEVE_101].passed
    ).toBeTruthy();

    // Volunteer completes Tutoring Skills
    quizScoreInput = {
      user: updatedVolunteer,
      category: TRAINING.TUTORING_SKILLS,
      idAnswerMap
    };

    result = await TrainingCtrl.getQuizScore(quizScoreInput);
    updatedVolunteer = await getVolunteer({ _id: volunteer._id });

    expectedResult = {
      tries: 1,
      passed: true
    };
    expect(result).toMatchObject(expectedResult);
    expect(updatedVolunteer.isOnboarded).toBeFalsy();
    expect(
      updatedVolunteer.certifications[TRAINING.TUTORING_SKILLS].passed
    ).toBeTruthy();

    // Volunteer completes Precalculus
    quizScoreInput = {
      user: updatedVolunteer,
      category: MATH_CERTS.PRECALCULUS,
      idAnswerMap
    };

    result = await TrainingCtrl.getQuizScore(quizScoreInput);
    updatedVolunteer = await getVolunteer({ _id: volunteer._id });

    expectedResult = {
      tries: 1,
      passed: true
    };
    expect(result).toMatchObject(expectedResult);
    expect(updatedVolunteer.isOnboarded).toBeTruthy();
    expect(
      updatedVolunteer.certifications[MATH_CERTS.PRECALCULUS].passed
    ).toBeTruthy();
  });

  test('Should create user actions for unlocking a subject', async () => {
    const certifications = buildCertificationsWithUpchieve101({
      [MATH_CERTS.CALCULUS_AB]: { passed: true, tries: 1 }
    });
    const volunteer = await insertVolunteer(
      buildVolunteer({ availabilityLastModifiedAt: new Date(), certifications })
    );

    const idAnswerMap = await generateIdAnswerMapHelper();
    const quizScoreInput = {
      user: volunteer,
      category: TRAINING.TUTORING_SKILLS,
      idAnswerMap
    };

    await TrainingCtrl.getQuizScore(quizScoreInput);
    const userActions = await UserActionModel.find({
      action: USER_ACTION.QUIZ.UNLOCKED_SUBJECT
    })
      .select('quizSubcategory -_id')
      .lean()
      .exec();

    const expectedUserActions = [
      { quizSubcategory: SUBJECTS.PRECALCULUS.toUpperCase() },
      { quizSubcategory: SUBJECTS.TRIGONOMETRY.toUpperCase() },
      { quizSubcategory: SUBJECTS.ALGEBRA.toUpperCase() },
      { quizSubcategory: SUBJECTS.PREALGREBA.toUpperCase() },
      { quizSubcategory: SUBJECTS.INTEGRATED_MATH_FOUR.toUpperCase() }
    ];

    expect(userActions).toEqual(expect.arrayContaining(expectedUserActions));
  });

  test('Should fail a quiz', async () => {
    const volunteer = await insertVolunteer(
      buildVolunteer({ availabilityLastModifiedAt: new Date() })
    );

    const idAnswerMap = await generateIdAnswerMapHelper(5);
    const quizScoreInput = {
      user: volunteer,
      category: TRAINING.UPCHIEVE_101,
      idAnswerMap
    };

    const result = await TrainingCtrl.getQuizScore(quizScoreInput);
    const updatedVolunteer = await getVolunteer({ _id: volunteer._id });

    const expectedResult = {
      tries: 1,
      passed: false
    };

    expect(result).toMatchObject(expectedResult);
    expect(
      updatedVolunteer.certifications[TRAINING.UPCHIEVE_101].passed
    ).toBeFalsy();
  });

  test('Grace period volunteer (an existing volunteer) should have the same subjects when completing required training', async () => {
    const certifications = buildCertifications({
      [MATH_CERTS.ALGEBRA]: { passed: true, tries: 1 }
    });
    const subjects = [SUBJECTS.PREALGREBA, SUBJECTS.ALGEBRA];
    const volunteer = await insertVolunteer(
      buildVolunteer({
        availabilityLastModifiedAt: new Date(),
        subjects,
        certifications,
        isOnboarded: true
      })
    );

    const idAnswerMap = await generateIdAnswerMapHelper();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let quizScoreInput: any = {
      user: volunteer,
      category: TRAINING.TUTORING_SKILLS,
      idAnswerMap
    };
    await TrainingCtrl.getQuizScore(quizScoreInput);
    let updatedVolunteer = await getVolunteer({ _id: volunteer._id });
    expect(updatedVolunteer.subjects).toEqual(subjects);

    quizScoreInput = {
      user: updatedVolunteer,
      category: TRAINING.UPCHIEVE_101,
      idAnswerMap
    };
    await TrainingCtrl.getQuizScore(quizScoreInput);
    updatedVolunteer = await getVolunteer({ _id: volunteer._id });
    expect(updatedVolunteer.subjects).toEqual(subjects);
  });

  test.todo(
    'Allow existing users to have a grace period for required training'
  );
});

describe('getUnlockedSubjects', () => {
  describe('Completes a new certification and has required training already completed', () => {
    test('Should not unlock any subjects if UPchieve 101 is not completed', async () => {
      const subject = MATH_CERTS.PRECALCULUS;
      const certifications = buildCertifications({
        [MATH_CERTS.PREALGREBA]: { passed: true, tries: 1 },
        [TRAINING.TUTORING_SKILLS]: { passed: true, tries: 1 }
      });
      const expected = [];

      const result = TrainingCtrl.getUnlockedSubjects(subject, certifications);
      expect(result).toEqual(expected);
    });

    test('Should unlock proper certs when taking Precalculus and Pre-algebra is prior cert', async () => {
      const subject = MATH_CERTS.PRECALCULUS;
      const certifications = buildCertificationsWithUpchieve101({
        [MATH_CERTS.PREALGREBA]: { passed: true, tries: 1 },
        [TRAINING.TUTORING_SKILLS]: { passed: true, tries: 1 }
      });
      const expected = [
        MATH_CERTS.PRECALCULUS,
        MATH_CERTS.TRIGONOMETRY,
        MATH_CERTS.ALGEBRA,
        MATH_CERTS.PREALGREBA,
        SUBJECTS.INTEGRATED_MATH_FOUR
      ];

      const result = TrainingCtrl.getUnlockedSubjects(subject, certifications);
      expect(result).toEqual(expected);
    });

    test('Should unlock proper certs when taking Calculus BC', async () => {
      const subject = MATH_CERTS.CALCULUS_BC;
      const certifications = buildCertificationsWithUpchieve101({
        [TRAINING.TUTORING_SKILLS]: { passed: true, tries: 1 }
      });
      const expected = [
        MATH_CERTS.CALCULUS_BC,
        MATH_CERTS.CALCULUS_AB,
        MATH_CERTS.PRECALCULUS,
        MATH_CERTS.TRIGONOMETRY,
        MATH_CERTS.ALGEBRA,
        MATH_CERTS.PREALGREBA,
        SUBJECTS.INTEGRATED_MATH_FOUR
      ];

      const result = TrainingCtrl.getUnlockedSubjects(subject, certifications);
      expect(result).toEqual(expected);
    });

    test('Should unlock proper certs when taking Calculus AB', async () => {
      const subject = MATH_CERTS.CALCULUS_AB;
      const certifications = buildCertificationsWithUpchieve101({
        [TRAINING.TUTORING_SKILLS]: { passed: true, tries: 1 }
      });
      const expected = [
        MATH_CERTS.CALCULUS_AB,
        MATH_CERTS.PRECALCULUS,
        MATH_CERTS.TRIGONOMETRY,
        MATH_CERTS.ALGEBRA,
        MATH_CERTS.PREALGREBA,
        SUBJECTS.INTEGRATED_MATH_FOUR
      ];

      const result = TrainingCtrl.getUnlockedSubjects(subject, certifications);
      expect(result).toEqual(expected);
    });

    test('Should unlock Integrated Math 1 when taking Algebra and is certified in Geometry and Statistics', async () => {
      const subject = MATH_CERTS.ALGEBRA;
      const certifications = buildCertificationsWithUpchieve101({
        [MATH_CERTS.GEOMETRY]: { passed: true, tries: 1 },
        [MATH_CERTS.STATISTICS]: { passed: true, tries: 1 },
        [TRAINING.TUTORING_SKILLS]: { passed: true, tries: 1 }
      });
      const expected = [
        MATH_CERTS.ALGEBRA,
        MATH_CERTS.PREALGREBA,
        MATH_CERTS.GEOMETRY,
        MATH_CERTS.STATISTICS,
        SUBJECTS.INTEGRATED_MATH_ONE
      ];

      const result = TrainingCtrl.getUnlockedSubjects(subject, certifications);
      expect(result).toEqual(expected);
    });

    test('Should unlock Integrated Math 2 when taking Trigonometry and is certified in Algebra, Geometry, and Statistics', async () => {
      const subject = MATH_CERTS.TRIGONOMETRY;
      const certifications = buildCertificationsWithUpchieve101({
        [MATH_CERTS.STATISTICS]: { passed: true, tries: 1 },
        [MATH_CERTS.GEOMETRY]: { passed: true, tries: 1 },
        [MATH_CERTS.ALGEBRA]: { passed: true, tries: 1 },
        [TRAINING.TUTORING_SKILLS]: { passed: true, tries: 1 }
      });
      const expected = [
        MATH_CERTS.TRIGONOMETRY,
        MATH_CERTS.ALGEBRA,
        MATH_CERTS.PREALGREBA,
        MATH_CERTS.GEOMETRY,
        MATH_CERTS.STATISTICS,
        SUBJECTS.INTEGRATED_MATH_ONE,
        SUBJECTS.INTEGRATED_MATH_TWO
      ];

      const result = TrainingCtrl.getUnlockedSubjects(subject, certifications);
      expect(result).toEqual(expected);
    });

    test('Should unlock Integrated Math 3 when higher cert unlocks Algebra and is certified in Statistics', async () => {
      const subject = MATH_CERTS.PRECALCULUS;
      const certifications = buildCertificationsWithUpchieve101({
        [MATH_CERTS.STATISTICS]: { passed: true, tries: 1 },
        [TRAINING.TUTORING_SKILLS]: { passed: true, tries: 1 }
      });
      const expected = [
        MATH_CERTS.PRECALCULUS,
        MATH_CERTS.TRIGONOMETRY,
        MATH_CERTS.ALGEBRA,
        MATH_CERTS.PREALGREBA,
        MATH_CERTS.STATISTICS,
        SUBJECTS.INTEGRATED_MATH_THREE,
        SUBJECTS.INTEGRATED_MATH_FOUR
      ];

      const result = TrainingCtrl.getUnlockedSubjects(subject, certifications);
      expect(result).toEqual(expected);
    });

    test('Should unlock all Integrated Math subjects when higher cert unlocks Algebra and is certified in Geometry and Statistics', async () => {
      const subject = MATH_CERTS.PRECALCULUS;
      const certifications = buildCertificationsWithUpchieve101({
        [MATH_CERTS.GEOMETRY]: { passed: true, tries: 1 },
        [MATH_CERTS.STATISTICS]: { passed: true, tries: 1 },
        [TRAINING.TUTORING_SKILLS]: { passed: true, tries: 1 }
      });
      const expected = [
        MATH_CERTS.PRECALCULUS,
        MATH_CERTS.TRIGONOMETRY,
        MATH_CERTS.ALGEBRA,
        MATH_CERTS.PREALGREBA,
        MATH_CERTS.GEOMETRY,
        MATH_CERTS.STATISTICS,
        SUBJECTS.INTEGRATED_MATH_ONE,
        SUBJECTS.INTEGRATED_MATH_TWO,
        SUBJECTS.INTEGRATED_MATH_THREE,
        SUBJECTS.INTEGRATED_MATH_FOUR
      ];

      const result = TrainingCtrl.getUnlockedSubjects(subject, certifications);
      expect(result).toEqual(expected);
    });

    test('Certs that should only unlock themselves', async () => {
      const subjects = [
        MATH_CERTS.PREALGREBA,
        MATH_CERTS.STATISTICS,
        MATH_CERTS.GEOMETRY,
        SCIENCE_CERTS.BIOLOGY,
        SCIENCE_CERTS.CHEMISTRY,
        SCIENCE_CERTS.PHYSICS_ONE,
        SCIENCE_CERTS.PHYSICS_TWO,
        SCIENCE_CERTS.ENVIRONMENTAL_SCIENCE
      ];

      const expected = [
        [MATH_CERTS.PREALGREBA],
        [MATH_CERTS.STATISTICS],
        [MATH_CERTS.GEOMETRY],
        [SCIENCE_CERTS.BIOLOGY],
        [SCIENCE_CERTS.CHEMISTRY],
        [SCIENCE_CERTS.PHYSICS_ONE],
        [SCIENCE_CERTS.PHYSICS_TWO],
        [SCIENCE_CERTS.ENVIRONMENTAL_SCIENCE]
      ];

      for (let i = 0; i < subjects.length; i++) {
        const certifications = buildCertificationsWithUpchieve101({
          [TRAINING.TUTORING_SKILLS]: { passed: true, tries: 1 }
        });
        const result = TrainingCtrl.getUnlockedSubjects(
          subjects[i],
          certifications
        );
        await expect(result).toEqual(expected[i]);
      }
    });

    test('Completing SAT Math should unlock SAT Math when certified in SAT Strategies', async () => {
      const subject = SAT_CERTS.SAT_MATH;
      const certifications = buildCertificationsWithUpchieve101({
        [TRAINING.SAT_STRATEGIES]: { passed: true, tries: 1 }
      });
      const expected = [SAT_CERTS.SAT_MATH];

      const result = TrainingCtrl.getUnlockedSubjects(subject, certifications);
      expect(result).toEqual(expected);
    });

    test('Completing a cert that should unlock SAT Math when certified in SAT Strategies and Tutoring Skills', async () => {
      const subject = MATH_CERTS.PRECALCULUS;
      const certifications = buildCertificationsWithUpchieve101({
        [TRAINING.TUTORING_SKILLS]: { passed: true, tries: 1 },
        [TRAINING.SAT_STRATEGIES]: { passed: true, tries: 1 }
      });
      const expected = [
        MATH_CERTS.PRECALCULUS,
        MATH_CERTS.TRIGONOMETRY,
        MATH_CERTS.ALGEBRA,
        MATH_CERTS.PREALGREBA,
        MATH_SUBJECTS.INTEGRATED_MATH_FOUR,
        SAT_CERTS.SAT_MATH
      ];

      const result = TrainingCtrl.getUnlockedSubjects(subject, certifications);
      expect(result).toEqual(expected);
    });
  });

  describe('Completes required training and already has a prior certification', () => {
    test('Should not unlock any subjects if UPchieve 101 is not completed', async () => {
      const subject = TRAINING.TUTORING_SKILLS;
      const certifications = buildCertifications({
        [MATH_CERTS.PREALGREBA]: { passed: true, tries: 1 }
      });
      const expected = [];

      const result = TrainingCtrl.getUnlockedSubjects(subject, certifications);
      expect(result).toEqual(expected);
    });

    test('Should unlock proper certs when taking Precalculus and Pre-algebra is prior cert', async () => {
      const subject = TRAINING.TUTORING_SKILLS;
      const certifications = buildCertificationsWithUpchieve101({
        [MATH_CERTS.PRECALCULUS]: { passed: true, tries: 1 }
      });
      const expected = [
        MATH_CERTS.PRECALCULUS,
        MATH_CERTS.TRIGONOMETRY,
        MATH_CERTS.ALGEBRA,
        MATH_CERTS.PREALGREBA,
        SUBJECTS.INTEGRATED_MATH_FOUR
      ];

      const result = TrainingCtrl.getUnlockedSubjects(subject, certifications);
      expect(result).toEqual(expected);
    });

    test('Should unlock proper certs when taking Calculus BC', async () => {
      const subject = TRAINING.TUTORING_SKILLS;
      const certifications = buildCertificationsWithUpchieve101({
        [MATH_CERTS.CALCULUS_BC]: { passed: true, tries: 1 }
      });
      const expected = [
        MATH_CERTS.CALCULUS_BC,
        MATH_CERTS.CALCULUS_AB,
        MATH_CERTS.PRECALCULUS,
        MATH_CERTS.TRIGONOMETRY,
        MATH_CERTS.ALGEBRA,
        MATH_CERTS.PREALGREBA,
        SUBJECTS.INTEGRATED_MATH_FOUR
      ];

      const result = TrainingCtrl.getUnlockedSubjects(subject, certifications);
      expect(result).toEqual(expected);
    });

    test('Should unlock proper certs when taking Calculus AB', async () => {
      const subject = TRAINING.TUTORING_SKILLS;
      const certifications = buildCertificationsWithUpchieve101({
        [MATH_CERTS.CALCULUS_AB]: { passed: true, tries: 1 }
      });

      const expected = [
        MATH_CERTS.CALCULUS_AB,
        MATH_CERTS.PRECALCULUS,
        MATH_CERTS.TRIGONOMETRY,
        MATH_CERTS.ALGEBRA,
        MATH_CERTS.PREALGREBA,
        SUBJECTS.INTEGRATED_MATH_FOUR
      ];

      const result = TrainingCtrl.getUnlockedSubjects(subject, certifications);
      expect(result).toEqual(expected);
    });

    test('Should unlock Integrated Math 1 when taking Algebra and is certified in Geometry and Statistics', async () => {
      const subject = TRAINING.TUTORING_SKILLS;
      const certifications = buildCertificationsWithUpchieve101({
        [MATH_CERTS.ALGEBRA]: { passed: true, tries: 1 },
        [MATH_CERTS.GEOMETRY]: { passed: true, tries: 1 },
        [MATH_CERTS.STATISTICS]: { passed: true, tries: 1 }
      });
      const expected = [
        MATH_CERTS.ALGEBRA,
        MATH_CERTS.PREALGREBA,
        MATH_CERTS.GEOMETRY,
        MATH_CERTS.STATISTICS,
        SUBJECTS.INTEGRATED_MATH_ONE
      ];

      const result = TrainingCtrl.getUnlockedSubjects(subject, certifications);
      expect(result).toEqual(expected);
    });

    test('Should unlock Integrated Math 2 when taking Trigonometry and is certified in Algebra, Geometry, and Statistics', async () => {
      const subject = TRAINING.TUTORING_SKILLS;
      const certifications = buildCertificationsWithUpchieve101({
        [MATH_CERTS.STATISTICS]: { passed: true, tries: 1 },
        [MATH_CERTS.GEOMETRY]: { passed: true, tries: 1 },
        [MATH_CERTS.ALGEBRA]: { passed: true, tries: 1 },
        [MATH_CERTS.TRIGONOMETRY]: { passed: true, tries: 1 }
      });
      const expected = [
        MATH_CERTS.ALGEBRA,
        MATH_CERTS.PREALGREBA,
        MATH_CERTS.GEOMETRY,
        MATH_CERTS.TRIGONOMETRY,
        MATH_CERTS.STATISTICS,
        SUBJECTS.INTEGRATED_MATH_ONE,
        SUBJECTS.INTEGRATED_MATH_TWO
      ];

      const result = TrainingCtrl.getUnlockedSubjects(subject, certifications);
      expect(result).toEqual(expected);
    });

    test('Should unlock Integrated Math 3 when higher cert unlocks Algebra and is certified in Statistics', async () => {
      const subject = TRAINING.TUTORING_SKILLS;
      const certifications = buildCertificationsWithUpchieve101({
        [MATH_CERTS.STATISTICS]: { passed: true, tries: 1 },
        [MATH_CERTS.PRECALCULUS]: { passed: true, tries: 1 }
      });
      const expected = [
        MATH_CERTS.PRECALCULUS,
        MATH_CERTS.TRIGONOMETRY,
        MATH_CERTS.ALGEBRA,
        MATH_CERTS.PREALGREBA,
        MATH_CERTS.STATISTICS,
        SUBJECTS.INTEGRATED_MATH_THREE,
        SUBJECTS.INTEGRATED_MATH_FOUR
      ];

      const result = TrainingCtrl.getUnlockedSubjects(subject, certifications);
      expect(result).toEqual(expected);
    });

    test('Should unlock all Integrated Math subjects when higher cert unlocks Algebra and is certified in Geometry and Statistics', async () => {
      const subject = TRAINING.TUTORING_SKILLS;
      const certifications = buildCertificationsWithUpchieve101({
        [MATH_CERTS.GEOMETRY]: { passed: true, tries: 1 },
        [MATH_CERTS.STATISTICS]: { passed: true, tries: 1 },
        [MATH_CERTS.PRECALCULUS]: { passed: true, tries: 1 }
      });
      const expected = [
        MATH_CERTS.GEOMETRY,
        MATH_CERTS.PRECALCULUS,
        MATH_CERTS.TRIGONOMETRY,
        MATH_CERTS.ALGEBRA,
        MATH_CERTS.PREALGREBA,
        MATH_CERTS.STATISTICS,
        SUBJECTS.INTEGRATED_MATH_ONE,
        SUBJECTS.INTEGRATED_MATH_TWO,
        SUBJECTS.INTEGRATED_MATH_THREE,
        SUBJECTS.INTEGRATED_MATH_FOUR
      ];

      const result = TrainingCtrl.getUnlockedSubjects(subject, certifications);
      expect(result).toEqual(expected);
    });

    test('Certs that should only unlock themselves when taking Tutoring Skills', async () => {
      const subject = TRAINING.TUTORING_SKILLS;
      const passedCerts = [
        MATH_CERTS.PREALGREBA,
        MATH_CERTS.STATISTICS,
        MATH_CERTS.GEOMETRY,
        SCIENCE_CERTS.BIOLOGY,
        SCIENCE_CERTS.CHEMISTRY,
        SCIENCE_CERTS.PHYSICS_ONE,
        SCIENCE_CERTS.PHYSICS_TWO,
        SCIENCE_CERTS.ENVIRONMENTAL_SCIENCE
      ];

      const expected = [
        [MATH_CERTS.PREALGREBA],
        [MATH_CERTS.STATISTICS],
        [MATH_CERTS.GEOMETRY],
        [SCIENCE_CERTS.BIOLOGY],
        [SCIENCE_CERTS.CHEMISTRY],
        [SCIENCE_CERTS.PHYSICS_ONE],
        [SCIENCE_CERTS.PHYSICS_TWO],
        [SCIENCE_CERTS.ENVIRONMENTAL_SCIENCE]
      ];

      for (let i = 0; i < passedCerts.length; i++) {
        const certifications = buildCertificationsWithUpchieve101({
          [passedCerts[i]]: { passed: true, tries: 1 }
        });
        const result = TrainingCtrl.getUnlockedSubjects(
          subject,
          certifications
        );
        await expect(result).toEqual(expected[i]);
      }
    });

    test('Completing SAT Strategies should unlock SAT Math when certified in SAT Math', async () => {
      const subject = TRAINING.SAT_STRATEGIES;
      const certifications = buildCertificationsWithUpchieve101({
        [SAT_CERTS.SAT_MATH]: { passed: true, tries: 1 }
      });
      const expected = [SAT_CERTS.SAT_MATH];

      const result = TrainingCtrl.getUnlockedSubjects(subject, certifications);
      expect(result).toEqual(expected);
    });
  });

  describe('Completing a required training cert', () => {
    test('Completing Tutoring Skills should not unlock any subjects', async () => {
      const certifications = buildCertificationsWithUpchieve101();
      const expected = [];

      const result = TrainingCtrl.getUnlockedSubjects(
        TRAINING.TUTORING_SKILLS,
        certifications
      );
      expect(result).toEqual(expected);
    });

    test('Completing College Counseling training unlocks Planning and Applications', async () => {
      const certifications = buildCertificationsWithUpchieve101();
      const expected = [SUBJECTS.PLANNING, SUBJECTS.APPLICATIONS];

      const result = TrainingCtrl.getUnlockedSubjects(
        TRAINING.COLLEGE_COUNSELING,
        certifications
      );
      expect(result).toEqual(expected);
    });
  });
});
