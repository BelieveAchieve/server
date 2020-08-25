import mongoose from 'mongoose';
import Volunteer from '../models/Volunteer';
import dbconnect from './dbconnect';
import { MATH_SUBJECTS, COLLEGE_SUBJECTS } from '../constants';

const passedCert = {
  passed: true,
  tries: 0
};
const defaultCert = {
  passed: false,
  tries: 0
};

const isCertifiedIn = (subject, subjects) => subjects.includes(subject)

async function upgrade(): Promise<void> {
  try {
    await dbconnect();

    const volunteers: any = await Volunteer.find({})
      .lean()
      .exec();
    const pendingUpdates = [];

    for (const volunteer of volunteers) {
      const passedCalculus = volunteer.certifications.calculus.passed;

      pendingUpdates.push(
        Volunteer.updateOne(
          { _id: volunteer._id },
          {
            $set: {
              /*** training related quiz certs ***/
              // @note: handled in add-training-courses.ts
              // 'certifications.upchieve101': defaultCert,
              // 'certifications.trainingSkills': defaultCert,
              // 'certifications.collegeSkills': defaultCert,
              // 'certifications.tutoringSkills': defaultCert,
              'certifications.collegeCounseling': defaultCert,
              'certifications.satStrategies': defaultCert,

              /*** subject quiz related certs ***/
              'certifications.calculusBC': defaultCert,
              'certifications.calculusAB': passedCalculus
                ? passedCert
                : defaultCert,
              'certifications.statistics': defaultCert,
              'certifications.environmentalScience': defaultCert,
              'certifications.physicsTwo': defaultCert,
              'certifications.financialAid': defaultCert,
              'certifications.sportsRecruitmentPlanning': defaultCert,
              'certifications.satMath': defaultCert,
              'certifications.satReading': defaultCert
            },
            $unset: {
              'certifications.integratedMathOne': '',
              'certifications.integratedMathTwo': '',
              'certifications.integratedMathThree': '',
              'certifications.integratedMathFour': '',
              'certifications.calculus': '',
            }
          },
          { strict: false }
        )
      );
    }
    const results = await Promise.all(pendingUpdates);
    console.log(results);
  } catch (error) {
    console.log('error', error);
  }

  mongoose.disconnect();
}

async function downgrade(): Promise<void> {
  try {
    await dbconnect();

    const volunteers: any = await Volunteer.find({})
      .lean()
      .exec();
    const pendingUpdates = [];

    for (const volunteer of volunteers) {
      const { subjects } = volunteer

      pendingUpdates.push(
        Volunteer.updateOne(
          { _id: volunteer._id },
          {
            $unset: {
              /*** training related certs certs ***/
              // @note: handled in add-training-courses.ts
              // 'certifications.upchieve101': '',
              // 'certifications.trainingSkills': '',
              // 'certifications.collegeSkills': '',
              // 'certifications.tutoringSkills': '',
              'certifications.collegeCounseling': '',
              'certifications.satStrategies': '',

              /*** quiz related certs certs ***/
              'certifications.calculusBC': '',
              'certifications.calculusAB': '',
              'certifications.statistics': '',
              'certifications.environmentalScience': '',
              'certifications.physicsTwo': '',
              'certifications.financialAid': '',
              'certifications.sportsRecruitmentPlanning': '',
              'certifications.satMath': '',
              'certifications.satReading': ''
            },
            $set: {
              'certifications.calculus': isCertifiedIn(MATH_SUBJECTS.CALCULUS_AB, subjects)
                ? passedCert
                : defaultCert,
              'certifications.integratedMathOne': isCertifiedIn(MATH_SUBJECTS.INTEGRATED_MATH_ONE, subjects)
                ? passedCert
                : defaultCert,
              'certifications.integratedMathTwo': isCertifiedIn(MATH_SUBJECTS.INTEGRATED_MATH_TWO, subjects)
                ? passedCert
                : defaultCert,
              'certifications.integratedMathThree': isCertifiedIn(MATH_SUBJECTS.INTEGRATED_MATH_THREE, subjects)
                ? passedCert
                : defaultCert,
              'certifications.integratedMathFour': isCertifiedIn(MATH_SUBJECTS.INTEGRATED_MATH_FOUR, subjects)
                ? passedCert
                : defaultCert,
            }
          },
          { strict: false }
        )
      );
    }

    const results = await Promise.all(pendingUpdates);
    console.log(results);
  } catch (error) {
    console.error(error);
  }

  mongoose.disconnect();
}

// To run migration:
// npx ts-node dbutils/add-new-quiz-certs.ts

// To downgrade the migration run:
// DOWNGRADE=true npx ts-node dbutils/add-new-quiz-certs.ts
if (process.env.DOWNGRADE) {
  downgrade();
} else {
  upgrade();
}
