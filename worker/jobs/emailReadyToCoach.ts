import VolunteerModel from '../../models/Volunteer';
import { IVolunteer } from '../../models/types';
import MailService from '../../services/MailService';
import { log } from '../logger';

export default async (): Promise<void> => {
  const volunteers = (await VolunteerModel.find({
    isOnboarded: true,
    isApproved: true,
    sentReadyToCoachEmail: false
  })
    .lean()
    .exec()) as IVolunteer[];

  for (const volunteer of volunteers) {
    await MailService.sendReadyToCoachEmail(volunteer);
  }

  await VolunteerModel.updateMany(
    {
      isOnboarded: true,
      isApproved: true,
      sentReadyToCoachEmail: false
    },
    { sentReadyToCoachEmail: true }
  );

  log(`sent ready-to-coach email to ${volunteers.length} volunteers`);
};
