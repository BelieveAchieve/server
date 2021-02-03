import { PHYSICS_MAPPING } from '../constants';

const isPhysics = (subtopic): boolean =>
  Object.keys(PHYSICS_MAPPING).includes(subtopic);

module.exports = isPhysics;
export default isPhysics;
