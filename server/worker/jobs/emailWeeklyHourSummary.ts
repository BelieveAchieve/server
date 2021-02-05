import moment from 'moment-timezone'
import { isEnabled } from 'unleash-client'
import { log } from '../logger'
import {
  getVolunteers,
  getHourSummaryStats
} from '../../services/VolunteerService'
import MailService from '../../services/MailService'
import VolunteerModel from '../../models/Volunteer'
import { volunteerPartnerManifests } from '../../partnerManifests'

// Runs weekly at 6am EST on Monday
export default async (): Promise<void> => {
  if (isEnabled('weekly-summary-email-cron')) {
    const unsubscribedPartners = []
    for (const partnerOrg in volunteerPartnerManifests) {
      if (!volunteerPartnerManifests[partnerOrg].receiveWeeklyHourSummaryEmail)
        unsubscribedPartners.push(partnerOrg)
    }

    const volunteers = await getVolunteers(
      {
        isBanned: false,
        isDeactivated: false,
        isFakeUser: false,
        isTestUser: false,
        volunteerPartnerOrg: { $nin: unsubscribedPartners }
      },
      {
        firstname: 1,
        email: 1,
        sentHourSummaryIntroEmail: 1
      }
    )

    //  Monday-Sunday
    const lastMonday = moment()
      .utc()
      .subtract(1, 'weeks')
      .startOf('isoWeek')
    const lastSunday = moment()
      .utc()
      .subtract(1, 'weeks')
      .endOf('isoWeek')
    let totalEmailed = 0
    for (const volunteer of volunteers) {
      const {
        _id,
        firstname: firstName,
        email,
        sentHourSummaryIntroEmail
      } = volunteer
      try {
        const summaryStats = await getHourSummaryStats(
          _id,
          lastMonday,
          lastSunday
        )
        // A volunteer must have non-zero totalVolunteerHours for the prior week (Monday-Sunday) to receive an email
        if (!summaryStats.totalVolunteerHours) continue

        const data = {
          firstName,
          email,
          sentHourSummaryIntroEmail,
          fromDate: lastMonday.format('dddd, MMM D'),
          toDate: lastSunday.format('dddd, MMM D'),
          ...summaryStats
        }
        await MailService.sendHourSummaryEmail(data)
        if (!sentHourSummaryIntroEmail)
          await VolunteerModel.updateOne(
            { _id },
            { sentHourSummaryIntroEmail: true }
          )
        totalEmailed++
      } catch (error) {
        log(
          `Failed to send weekly hour summary email to volunteer ${_id}: ${error}`
        )
      }
    }

    return log(
      `Emailed weekly hour summary email to ${totalEmailed} volunteers`
    )
  }
}
