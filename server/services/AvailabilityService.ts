import { Query, Types } from 'mongoose';
import AvailabilitySnapshotModel, {
  AvailabilitySnapshot,
  AvailabilitySnapshotDocument
} from '../models/Availability/Snapshot';
import AvailabilityHistoryModel, {
  AvailabilityHistory,
  AvailabilityHistoryDocument
} from '../models/Availability/History';
import { AvailabilityDay } from '../models/Availability/types';

export const getAvailability = (
  query,
  projection = {}
): Promise<AvailabilitySnapshot> => {
  return AvailabilitySnapshotModel.findOne(query)
    .select(projection)
    .lean()
    .exec();
};

export const getAvailabilities = (
  query,
  projection = {}
): Promise<AvailabilitySnapshot[]> => {
  return AvailabilitySnapshotModel.find(query)
    .select(projection)
    .lean()
    .exec();
};

export const getAvailabilityHistory = (
  query,
  projection = {}
): Promise<AvailabilityHistory> => {
  return AvailabilityHistoryModel.findOne(query)
    .select(projection)
    .lean()
    .exec();
};

// @todo: Create a compound index on date and volunteerId
export const getRecentAvailabilityHistory = async (
  volunteerId: Types.ObjectId | string
): Promise<AvailabilityHistory> => {
  const [document] = await AvailabilityHistoryModel.find({ volunteerId })
    .sort({ date: -1 })
    .limit(1)
    .lean()
    .exec();

  return document;
};

export const getElapsedAvailability = (day: AvailabilityDay): number => {
  let elapsedAvailability = 0;
  const availabileTimes = Object.values(day);
  for (const time of availabileTimes) {
    if (time) elapsedAvailability++;
  }

  return elapsedAvailability;
};

export const getElapsedAvailabilityForDateRange = async (
  volunteerId: Types.ObjectId | string,
  fromDate: Date,
  toDate: Date
): Promise<number> => {
  const historyDocs = await AvailabilityHistoryModel.aggregate([
    {
      $match: {
        volunteerId,
        date: {
          $gte: new Date(fromDate),
          $lte: new Date(toDate)
        }
      }
    },
    {
      $project: {
        availability: 1
      }
    }
  ]);

  let totalElapsedAvailability = 0;
  for (const doc of historyDocs) {
    totalElapsedAvailability += getElapsedAvailability(doc.availability);
  }

  return totalElapsedAvailability;
};

export const createAvailabilitySnapshot = (
  volunteerId: Types.ObjectId | string
): Promise<AvailabilitySnapshotDocument> =>
  AvailabilitySnapshotModel.create({ volunteerId });

export const updateAvailabilitySnapshot = (
  volunteerId: Types.ObjectId | string,
  update: Partial<AvailabilitySnapshot>
): Query<AvailabilitySnapshotDocument> =>
  AvailabilitySnapshotModel.updateOne(
    {
      volunteerId
    },
    update
  );

export const createAvailabilityHistory = (data: {
  availability: AvailabilityDay;
  volunteerId: Types.ObjectId;
  timezone: string;
  date: Date;
}): Promise<AvailabilityHistoryDocument> =>
  AvailabilityHistoryModel.create(data);
