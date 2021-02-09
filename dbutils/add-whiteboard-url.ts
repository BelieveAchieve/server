import mongoose from 'mongoose';
import SessionModel from '../models/Session';
import dbconnect from './dbconnect';

async function upgrade(): Promise<void> {
  try {
    await dbconnect();
    const result = await SessionModel.updateMany(
      {},
      {
        $set: {
          whiteboardUrl: ''
        }
      },
    );

    console.log(result);
  } catch (error) {
    console.log('error', error);
  }

  mongoose.disconnect();
}

async function downgrade(): Promise<void> {
  try {
    await dbconnect();
    const results = await SessionModel.updateMany(
      {},
      {
        $unset: {
          whiteboardUrl: ''
        }
      }
    );
    console.log(results);
  } catch (error) {
    console.error(error);
  }

  mongoose.disconnect();
}

// To run migration:
// npx ts-node dbutils/add-whiteboard-url.ts

// To downgrade the migration run:
// DOWNGRADE=true npx ts-node dbutils/add-whiteboard-url.ts
if (process.env.DOWNGRADE) {
  downgrade();
} else {
  upgrade();
}
