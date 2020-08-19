import {
  MATH_CERTS,
  SCIENCE_CERTS,
  COLLEGE_CERTS,
  SAT_CERTS,
  REQUIRED_TRAINING,
  SUBJECT_TYPES
} from '../constants';

const getSubjectType = (subject): string => {
  let type = '';

  if (Object.values(MATH_CERTS).includes(subject)) type = SUBJECT_TYPES.MATH;
  if (Object.values(SCIENCE_CERTS).includes(subject))
    type = SUBJECT_TYPES.SCIENCE;
  if (Object.values(COLLEGE_CERTS).includes(subject))
    type = SUBJECT_TYPES.COLLEGE;
  if (Object.values(SAT_CERTS).includes(subject)) type = SUBJECT_TYPES.SAT;
  if (Object.values(REQUIRED_TRAINING).includes(subject))
    type = SUBJECT_TYPES.REQUIRED_TRAINING;

  return type;
};

module.exports = getSubjectType;
export default getSubjectType;
