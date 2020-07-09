import VolunteerModel from '../../models/Volunteer';
import { Volunteer } from '../../models/types';
import MailService from '../../services/SessionService';
import dbconnect from '../../dbutils/dbconnect';
import { log } from '../logger';

export default async (): Promise<void> => {
  await dbconnect();
  const volunteers = (await VolunteerModel.find({
    isOnboarded: true,
    isApproved: true,
    sentReadyToCoachEmail: false
  })
    .lean()
    .exec()) as Volunteer[];

  for (const volunteer of volunteers) {
    await MailService.sendReadyToCoachEmail(volunteer);
  }

  log(`sent ready-to-coach email to ${volunteers.length} volunteers`);
};
