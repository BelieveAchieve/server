import {
  INTEGRATED_MATH_MAPPING,
  PHYSICS_MAPPING,
  CALCULUS_MAPPING,
  MATH_CERTS
} from '../constants';
import isIntegratedMath from './is-integrated-math';
import isPhysics from './is-physics';
import isCalculus from './is-calculus';
import isAlgebra from './is-algebra';

const mapMultiWordSubtopic = (subtopic): string => {
  if (isIntegratedMath(subtopic)) return INTEGRATED_MATH_MAPPING[subtopic];
  if (isPhysics(subtopic)) return PHYSICS_MAPPING[subtopic];
  if (isCalculus(subtopic)) return CALCULUS_MAPPING[subtopic];
  if (isAlgebra(subtopic)) return MATH_CERTS.ALGEBRA;

  return subtopic;
};

module.exports = mapMultiWordSubtopic;
export default mapMultiWordSubtopic;
