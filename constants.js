const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
]

const UTC_TO_HOUR_MAPPING = {
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
}

const USER_ACTION = {
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
    UPDATED_PROFILE: 'UPDATED PROFILE'
  }
}

const USER_BAN_REASON = {
  NON_US_SIGNUP: 'NON US SIGNUP',
  BANNED_IP: 'USED BANNED IP',
  SESSION_REPORTED: 'SESSION REPORTED',
  BANNED_SERVICE_PROVIDER: 'BANNED SERVICE PROVIDER'
}

const IP_ADDRESS_STATUS = {
  OK: 'OK',
  BANNED: 'BANNED'
}

const INTEGRATED_MATH_MAPPING = {
  integratedmathone: 'integratedMathOne',
  integratedmathtwo: 'integratedMathTwo',
  integratedmaththree: 'integratedMathThree',
  integratedmathfour: 'integratedMathFour'
}

const FORMAT_INTEGRATED_MATH = {
  integratedMathOne: 'Integrated Math 1',
  integratedMathTwo: 'Integrated Math 2',
  integratedMathThree: 'Integrated Math 3',
  integratedMathFour: 'Integrated Math 4'
}

const PHYSICS_MAPPING = {
  physicsone: 'physicsOne'
}

const FORMAT_PHYSICS = {
  physicsOne: 'Physics 1'
}

const PHOTO_ID_STATUS = {
  EMPTY: 'EMPTY',
  SUBMITTED: 'SUBMITTED',
  REJECTED: 'REJECTED',
  APPROVED: 'APPROVED'
}

const REFERENCE_STATUS = {
  UNSENT: 'UNSENT',
  SENT: 'SENT',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
}

module.exports = {
  DAYS,
  UTC_TO_HOUR_MAPPING,
  USER_ACTION,
  USER_BAN_REASON,
  IP_ADDRESS_STATUS,
  INTEGRATED_MATH_MAPPING,
  FORMAT_INTEGRATED_MATH,
  PHYSICS_MAPPING,
  FORMAT_PHYSICS,
  PHOTO_ID_STATUS,
  REFERENCE_STATUS
}
