import { PHYSICS_MAPPING } from '../constants';

const isPhysics = (subTopic): boolean =>
  Object.keys(PHYSICS_MAPPING).includes(subTopic);

module.exports = isPhysics;
export default isPhysics;
