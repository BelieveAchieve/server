import mongoose from 'mongoose';
import User from '../models/User';
import dbconnect from './dbconnect';

async function upgrade(): Promise<void> {
  try {
    await dbconnect();
    const result = await User.bulkWrite([
      {
        updateMany: {
          filter: {
            isVolunteer: true
          },
          update: {
            $set: {
              'certifications.integratedMathOne': { passed: false, tries: 0 },
              'certifications.integratedMathTwo': { passed: false, tries: 0 },
              'certifications.integratedMathThree': { passed: false, tries: 0 },
              'certifications.integratedMathFour': { passed: false, tries: 0 }
            }
          }
        }
      },
      {
        updateMany: {
          filter: {
            isVolunteer: true,
            'certifications.algebra.passed': true,
            'certifications.geometry.passed': true
          },
          update: {
            $set: {
              'certifications.integratedMathOne': { passed: true, tries: 0 }
            }
          }
        }
      },
      {
        updateMany: {
          filter: {
            isVolunteer: true,
            'certifications.algebra.passed': true,
            'certifications.geometry.passed': true,
            'certifications.trigonometry.passed': true
          },
          update: {
            $set: {
              'certifications.integratedMathTwo': { passed: true, tries: 0 }
            }
          }
        }
      },
      {
        updateMany: {
          filter: {
            isVolunteer: true,
            'certifications.algebra.passed': true,
            'certifications.trigonometry.passed': true,
            'certifications.precalculus.passed': true
          },
          update: {
            $set: {
              'certifications.integratedMathThree': { passed: true, tries: 0 }
            }
          }
        }
      },
      {
        updateMany: {
          filter: {
            isVolunteer: true,
            'certifications.algebra.passed': true,
            'certifications.trigonometry.passed': true,
            'certifications.precalculus.passed': true
          },
          update: {
            $set: {
              'certifications.integratedMathFour': { passed: true, tries: 0 }
            }
          }
        }
      }
    ]);

    console.log(result);
  } catch (error) {
    console.log('error', error);
  }
}

async function downgrade(): Promise<void> {
  try {
    await dbconnect();
    const results = await User.updateMany(
      {},
      {
        $unset: {
          'certifications.integratedMathOne': '',
          'certifications.integratedMathTwo': '',
          'certifications.integratedMathThree': '',
          'certifications.integratedMathFour': ''
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
// DOWNGRADE=true npx ts-node dbutils/add-integrated-math.ts
if (process.env.DOWNGRADE) {
  downgrade();
} else {
  upgrade();
}
