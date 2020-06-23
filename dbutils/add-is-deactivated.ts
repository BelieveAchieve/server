import mongoose from 'mongoose';
import User from '../models/User';
import dbconnect from './dbconnect';

async function upgrade(): Promise<void> {
  try {
    await dbconnect();
    const result = await User.updateMany({}, { isDeactivated: false });

    console.log(result);
  } catch (error) {
    console.log('error', error);
  }

  mongoose.disconnect();
}

async function downgrade(): Promise<void> {
  try {
    await dbconnect();
    const result = await User.updateMany(
      {},
      {
        $unset: {
          isDeactivated: ''
        }
      }
    );
    console.log(result);
  } catch (error) {
    console.error(error);
  }

  mongoose.disconnect();
}

// To downgrade the migration run:
// DOWNGRADE=true npx ts-node dbutils/add-is-deactivated.ts
if (process.env.DOWNGRADE) {
  downgrade();
} else {
  upgrade();
}
