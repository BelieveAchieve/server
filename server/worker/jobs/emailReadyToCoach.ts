import VolunteerModel, { Volunteer } from '../../models/Volunteer'
import MailService from '../../services/MailService'
import { log } from '../logger'

export default async (): Promise<void> => {
  const volunteers = (await VolunteerModel.find({
    isOnboarded: true,
    isApproved: true,
    sentReadyToCoachEmail: false
  })
    .lean()
    .exec()) as Volunteer[]

  for (const volunteer of volunteers) {
    await MailService.sendReadyToCoachEmail(volunteer)
  }

  await VolunteerModel.updateMany(
    {
      isOnboarded: true,
      isApproved: true,
      sentReadyToCoachEmail: false
    },
    { sentReadyToCoachEmail: true }
  )

  log(`sent ready-to-coach email to ${volunteers.length} volunteers`)
}
