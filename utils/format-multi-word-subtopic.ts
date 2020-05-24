import { FORMAT_INTEGRATED_MATH, FORMAT_PHYSICS } from '../constants';
import isIntegratedMath from './is-integrated-math';
import isPhysics from './is-physics';

const formatMultiWordSubtopic = (subtopic): string => {
  if (isIntegratedMath(subtopic)) return FORMAT_INTEGRATED_MATH[subtopic];
  if (isPhysics(subtopic)) return FORMAT_PHYSICS[subtopic];

  return subtopic;
};

export default formatMultiWordSubtopic;
