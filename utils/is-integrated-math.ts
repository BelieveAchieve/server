import { INTEGRATED_MATH_MAPPING } from '../constants';

const isIntegratedMath = (subtopic): boolean =>
  Object.keys(INTEGRATED_MATH_MAPPING).includes(subtopic);

module.exports = isIntegratedMath;
export default isIntegratedMath;
