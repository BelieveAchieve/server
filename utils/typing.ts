import { Types } from 'mongoose';

export const isObjectId = (
  data: Types.ObjectId | any // eslint-disable-line @typescript-eslint/no-explicit-any
): data is Types.ObjectId => {
  return data instanceof Types.ObjectId;
};
