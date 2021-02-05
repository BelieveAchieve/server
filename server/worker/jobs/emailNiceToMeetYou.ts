import { log } from '../logger'
import VolunteerModel from '../../models/Volunteer'
import MailService from '../../services/MailService'

// Runs every day at 10am EST
export default async (): Promise<void> => {
  const oneDay = 1000 * 60 * 60 * 24 * 1
  const oneDayAgo = new Date(Date.now() - oneDay).setHours(0, 0, 0, 0)
  const todaysDate = new Date()
  // set the date to midnight
  todaysDate.setHours(0, 0, 0, 0)

  const volunteers = await VolunteerModel.find({
    createdAt: {
      $gte: new Date(oneDayAgo),
      $lte: new Date(todaysDate)
    }
  })
    .select('firstname email')
    .lean()
    .exec()

  let totalEmailed = 0

  for (const volunteer of volunteers) {
    try {
      await MailService.sendNiceToMeetYou(volunteer)
      totalEmailed++
    } catch (error) {
      log(
        `Failed to email "nice to meet you" to volunteer ${volunteer._id}: ${error}`
      )
    }
  }

  return log(`Emailed "nice to meet you" to ${totalEmailed} volunteers`)
}
