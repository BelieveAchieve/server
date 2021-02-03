import {
  FORMAT_INTEGRATED_MATH,
  FORMAT_PHYSICS,
  FORMAT_CALCULUS,
  FORMAT_ALGEBRA,
  FORMAT_SAT
} from '../constants';

const formatMultiWordSubtopic = (subtopic): string => {
  if (FORMAT_INTEGRATED_MATH[subtopic]) return FORMAT_INTEGRATED_MATH[subtopic];
  if (FORMAT_PHYSICS[subtopic]) return FORMAT_PHYSICS[subtopic];
  if (FORMAT_CALCULUS[subtopic]) return FORMAT_CALCULUS[subtopic];
  if (FORMAT_ALGEBRA[subtopic]) return FORMAT_ALGEBRA[subtopic];
  if (FORMAT_SAT[subtopic]) return FORMAT_SAT[subtopic];

  return subtopic;
};

module.exports = formatMultiWordSubtopic;
export default formatMultiWordSubtopic;
