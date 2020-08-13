export const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

export const UTC_TO_HOUR_MAPPING = {
  0: '12a',
  1: '1a',
  2: '2a',
  3: '3a',
  4: '4a',
  5: '5a',
  6: '6a',
  7: '7a',
  8: '8a',
  9: '9a',
  10: '10a',
  11: '11a',
  12: '12p',
  13: '1p',
  14: '2p',
  15: '3p',
  16: '4p',
  17: '5p',
  18: '6p',
  19: '7p',
  20: '8p',
  21: '9p',
  22: '10p',
  23: '11p'
};

export const USER_ACTION = {
  TYPE: {
    QUIZ: 'QUIZ',
    SESSION: 'SESSION',
    ACCOUNT: 'ACCOUNT'
  },
  QUIZ: {
    STARTED: 'STARTED QUIZ',
    PASSED: 'PASSED QUIZ',
    FAILED: 'FAILED QUIZ',
    VIEWED_MATERIALS: 'VIEWED REVIEW MATERIALS'
  },
  SESSION: {
    REQUESTED: 'REQUESTED SESSION',
    JOINED: 'JOINED SESSION',
    REJOINED: 'REJOINED SESSION',
    ENDED: 'ENDED SESSION',
    REPLIED_YES: 'REPLIED YES TO TEXT'
  },
  ACCOUNT: {
    CREATED: 'CREATED',
    UPDATED_AVAILABILITY: 'UPDATED AVAILABILITY',
    UPDATED_PROFILE: 'UPDATED PROFILE',
    ADDED_PHOTO_ID: 'ADDED PHOTO ID',
    ADDED_REFERENCE: 'ADDED REFERENCE',
    COMPLETED_BACKGROUND_INFO: 'COMPLETED BACKGROUND INFORMATION',
    DELETED_REFERENCE: 'DELETED REFERENCE',
    APPROVED: 'APPROVED',
    ONBOARDED: 'ONBOARDED',
    SUBMITTED_REFERENCE_FORM: 'SUBMITTED REFERENCE FORM',
    REJECTED_PHOTO_ID: 'REJECTED PHOTO ID',
    REJECTED_REFERENCE: 'REJECTED REFERENCE'
  }
};

export const USER_BAN_REASON = {
  NON_US_SIGNUP: 'NON US SIGNUP',
  BANNED_IP: 'USED BANNED IP',
  SESSION_REPORTED: 'SESSION REPORTED',
  BANNED_SERVICE_PROVIDER: 'BANNED SERVICE PROVIDER'
};

export enum IP_ADDRESS_STATUS {
  OK = 'OK',
  BANNED = 'BANNED'
}

export const INTEGRATED_MATH_MAPPING = {
  integratedmathone: 'integratedMathOne',
  integratedmathtwo: 'integratedMathTwo',
  integratedmaththree: 'integratedMathThree',
  integratedmathfour: 'integratedMathFour'
};

export const FORMAT_INTEGRATED_MATH = {
  integratedMathOne: 'Integrated Math 1',
  integratedMathTwo: 'Integrated Math 2',
  integratedMathThree: 'Integrated Math 3',
  integratedMathFour: 'Integrated Math 4'
};

export const PHYSICS_MAPPING = {
  physicsone: 'physicsOne'
};

export const FORMAT_PHYSICS = {
  physicsOne: 'Physics 1'
};

export const STATUS = {
  SUBMITTED: 'SUBMITTED',
  REJECTED: 'REJECTED',
  APPROVED: 'APPROVED'
};

export const PHOTO_ID_STATUS = {
  EMPTY: 'EMPTY',
  SUBMITTED: STATUS.SUBMITTED,
  REJECTED: STATUS.REJECTED,
  APPROVED: STATUS.APPROVED
};

export const REFERENCE_STATUS = {
  UNSENT: 'UNSENT',
  SENT: 'SENT',
  SUBMITTED: STATUS.SUBMITTED,
  REJECTED: STATUS.REJECTED,
  APPROVED: STATUS.APPROVED
};

export const SESSION_REPORT_REASON = {
  STUDENT_RUDE: 'Student was rude',
  STUDENT_MISUSE: 'Student was misusing platform'
};

// todo: remove algebra
export enum SUBJECTS {
  PREALGREBA = 'prealgebra',
  ALGEBRA = 'algebra',
  ALGEBRA_ONE = 'algebraOne',
  ALGEBRA_TWO = 'algebraTwo',
  GEOMETRY = 'geometry',
  TRIGONOMETRY = 'trigonometry',
  PRECALCULUS = 'precalculus',
  CALCULUS = 'calculus',
  CALCULUS_AB = 'calculusAB',
  CALCULUS_BC = 'calculusBC',
  INTEGRATED_MATH_ONE = 'integratedMathOne',
  INTEGRATED_MATH_TWO = 'integratedMathTwo',
  INTEGRATED_MATH_THREE = 'integratedMathThree',
  INTEGRATED_MATH_FOUR = 'integratedMathFour',
  STATISTICS = 'statistics',
  BIOLOGY = 'biology',
  CHEMISTRY = 'chemistry',
  PHYSICS_ONE = 'physicsOne',
  PHYSICS_TWO = 'physicsTwo',
  ENVIRONMENTAL_SCIENCE = 'environmentalScience',
  PLANNING = 'planning',
  APPLICATIONS = 'applications',
  ESSAYS = 'essays',
  FINANCIAL_AID = 'financialAid',
  SPORTS_RECRUIMENT_PLANNING = 'sportsRecruitmentPlanning',
  SAT_MATH = 'satMath',
  SAT_READING = 'satReading'
}

export const CERT_UNLOCKING = {
  calculusBC: [
    SUBJECTS.CALCULUS_BC,
    SUBJECTS.CALCULUS_AB,
    SUBJECTS.PRECALCULUS,
    SUBJECTS.TRIGONOMETRY,
    SUBJECTS.ALGEBRA_TWO,
    SUBJECTS.ALGEBRA_ONE,
    SUBJECTS.PREALGREBA
  ],
  calculusAB: [
    SUBJECTS.CALCULUS_AB,
    SUBJECTS.PRECALCULUS,
    SUBJECTS.TRIGONOMETRY,
    SUBJECTS.ALGEBRA_TWO,
    SUBJECTS.ALGEBRA_ONE,
    SUBJECTS.PREALGREBA
  ],
  precalculus: [
    SUBJECTS.PRECALCULUS,
    SUBJECTS.TRIGONOMETRY,
    SUBJECTS.ALGEBRA_TWO,
    SUBJECTS.ALGEBRA_ONE,
    SUBJECTS.PREALGREBA
  ],
  trigonometry: [SUBJECTS.TRIGONOMETRY],
  algebraTwo: [SUBJECTS.ALGEBRA_TWO, SUBJECTS.ALGEBRA_ONE, SUBJECTS.PREALGREBA],
  algebraOne: [SUBJECTS.ALGEBRA_ONE, SUBJECTS.PREALGREBA],
  prealgebra: [SUBJECTS.PREALGREBA],
  statistics: [SUBJECTS.STATISTICS],
  geometry: [SUBJECTS.GEOMETRY],
  biology: [SUBJECTS.BIOLOGY],
  chemistry: [SUBJECTS.CHEMISTRY],
  physicsOne: [SUBJECTS.PHYSICS_ONE],
  physicsTwo: [SUBJECTS.PHYSICS_TWO],
  environmentalScience: [SUBJECTS.ENVIRONMENTAL_SCIENCE],
  planning: [SUBJECTS.PLANNING],
  applications: [SUBJECTS.APPLICATIONS],
  essays: [SUBJECTS.ESSAYS],
  financialAid: [SUBJECTS.FINANCIAL_AID],
  sportsRecruitmentPlanning: [SUBJECTS.SPORTS_RECRUIMENT_PLANNING],
  satMath: [SUBJECTS.SAT_MATH],
  satReading: [SUBJECTS.SAT_READING]
};

// todo: check if algebra 1 or 2
export const COMPUTED_CERTS = {
  integratedMathOne: [
    SUBJECTS.ALGEBRA_ONE,
    SUBJECTS.GEOMETRY,
    SUBJECTS.STATISTICS
  ],
  integratedMathTwo: [
    SUBJECTS.ALGEBRA_ONE,
    SUBJECTS.GEOMETRY,
    SUBJECTS.STATISTICS,
    SUBJECTS.TRIGONOMETRY
  ],
  integratedMathThree: [SUBJECTS.PRECALCULUS, SUBJECTS.STATISTICS],
  integratedMathFour: [SUBJECTS.PRECALCULUS],
  // Calculus AB, Calculus BC, or Precalculus can also unlock SAT Math
  satMath: [SUBJECTS.ALGEBRA_ONE, SUBJECTS.TRIGONOMETRY, SUBJECTS.GEOMETRY]
};
