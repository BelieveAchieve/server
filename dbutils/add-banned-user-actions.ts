import mongoose from 'mongoose';
import UserAction from '../models/UserAction';
import Session from '../models/Session';
import dbconnect from './dbconnect';
import { SESSION_REPORT_REASON, USER_ACTION, USER_BAN_REASON} from '../constants'

async function upgrade(): Promise<void> {
  try {
    await dbconnect();
    

    const sessions = await Session.find({
      reportReason: { $in: [SESSION_REPORT_REASON.STUDENT_RUDE, SESSION_REPORT_REASON.STUDENT_MISUSE]}
    })

    const newUserActions = []
    for(const session of sessions){
      const userAction = new UserAction({
        user: session.student,
        actionType: USER_ACTION.TYPE.ACCOUNT,
        ipAddress: '',
        action: USER_ACTION.ACCOUNT.BANNED,
        session: session._id,
        banReason: USER_BAN_REASON.SESSION_REPORTED,
        createdAt: session.createdAt,
      })

      newUserActions.push(userAction.save())
    }

    const result = await Promise.all(newUserActions)
  
    console.log(result);
  } catch (error) {
    console.log('error', error);
  }

  mongoose.disconnect();
}

async function downgrade(): Promise<void> {
  try {
    await dbconnect();
    const results = await UserAction.deleteMany(
      { action: USER_ACTION.ACCOUNT.BANNED },
    );
    console.log(results);
  } catch (error) {
    console.error(error);
  }

  mongoose.disconnect();
}

// To run migration:
// npx ts-node dbutils/add-banned-user-actions.ts

// To downgrade the migration run:
// DOWNGRADE=true npx ts-node dbutils/add-banned-user-actions.ts
if (process.env.DOWNGRADE) {
  downgrade();
} else {
  upgrade();
}
