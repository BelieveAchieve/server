import { INTEGRATED_MATH_MAPPING } from '../constants';

const isIntegratedMath = (subTopic): boolean =>
  Object.keys(INTEGRATED_MATH_MAPPING).includes(subTopic);

module.exports = isIntegratedMath;
export default isIntegratedMath;
