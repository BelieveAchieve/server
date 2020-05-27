import { FORMAT_INTEGRATED_MATH, FORMAT_PHYSICS } from '../constants';

const formatMultiWordSubtopic = (subtopic): string => {
  if (FORMAT_INTEGRATED_MATH[subtopic]) return FORMAT_INTEGRATED_MATH[subtopic];
  if (FORMAT_PHYSICS[subtopic]) return FORMAT_PHYSICS[subtopic];

  return subtopic;
};

module.exports = formatMultiWordSubtopic;
export default formatMultiWordSubtopic;
