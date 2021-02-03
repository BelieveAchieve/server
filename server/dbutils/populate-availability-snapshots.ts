import mongoose from 'mongoose';
import dbconnect from './dbconnect';
import AvailabilitySnapshotModel from '../models/Availability/Snapshot';
import VolunteerModel from '../models/Volunteer';
import util from 'util';
const setImmediatePromise = util.promisify(setImmediate);

const upgrade = async (): Promise<void> => {
  try {
    await dbconnect();

    const volunteers: any = await VolunteerModel.find({})
      .select({
        _id: 1,
        availability: 1,
        availabilityLastModifiedAt: 1,
        createdAt: 1,
        timezone: 1
      })
      .lean()
      .exec();

    const docs = [];
    for (const volunteer of volunteers) {
      docs.push({
        volunteerId: volunteer._id,
        onCallAvailability: volunteer.availability,
        modifiedAt: volunteer.availabilityLastModifiedAt,
        createdAt: volunteer.createdAt,
        timezone: volunteer.timezone
      });
    }

    const chunks = [];
    const chunkSizeLimit = 50;
    for (let i = 0; i <= Math.floor(docs.length / chunkSizeLimit); i++) {
      const chunk = docs.slice(i * chunkSizeLimit, chunkSizeLimit * (i + 1));
      chunks.push(chunk);
    }

    for (const chunk of chunks) {
      await setImmediatePromise();
      console.log('\n\n After IO ~~~');
      await AvailabilitySnapshotModel.insertMany(chunk);
      console.log('Inserted!');
    }
  } catch (error) {
    console.error(error);
  }
  // Only disconnect after uploading has finished
  await setImmediatePromise();
  console.log('Disconnecting')
  mongoose.disconnect();
};

upgrade();
