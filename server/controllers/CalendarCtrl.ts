import _ from 'lodash'
import VolunteerModel, { Volunteer } from '../models/Volunteer'
import { Availability } from '../models/Availability/types'
import { updateAvailabilitySnapshot } from '../services/AvailabilityService'
import { captureEvent } from '../services/AnalyticsService'
import { EVENTS } from '../constants'
import * as UserActionCtrl from './UserActionCtrl'

export interface UpdateScheduleOptions {
  ip: string
  user: Volunteer
  // @note: this is set to optional to test the absence of an availability object
  availability?: Availability
  tz: string // FIXME: constrain this to official timezones
}

export async function updateSchedule(
  options: UpdateScheduleOptions
): Promise<void> {
  const user = options.user
  const newAvailability = options.availability
  const newTimezone = options.tz
  const ip = options.ip

  // verify that newAvailability is defined and not null
  if (!newAvailability) {
    // early exit
    throw new Error('No availability object specified')
  }

  // verify that all of the day-of-week and time-of-day properties are defined on the
  // new availability object
  if (
    Object.keys(user.availability).some(key => {
      if (typeof newAvailability[key] === 'undefined') {
        // day-of-week property needs to be defined
        return true
      }

      // time-of-day properties also need to be defined
      return Object.keys(user.availability[key]).some(
        key2 => typeof newAvailability[key][key2] === 'undefined'
      )
    })
  ) {
    throw new Error('Availability object missing required keys')
  }

  const currentDate = new Date()
  const volunteerUpdates: Partial<Volunteer> = {
    // @note: keep "availability", "timezone", "availabilityLastModifiedAt" for a volunteer until new availability schema is migrated
    availabilityLastModifiedAt: currentDate,
    availability: newAvailability,
    timezone: newTimezone
  }
  // an onboarded volunteer must have updated their availability, completed required training, and unlocked a subject
  if (!user.isOnboarded && user.subjects.length > 0) {
    volunteerUpdates.isOnboarded = true
    UserActionCtrl.accountOnboarded(user._id, ip)
    captureEvent(user._id, EVENTS.ACCOUNT_ONBOARDED, {
      event: EVENTS.ACCOUNT_ONBOARDED
    })
  }

  const availabilityUpdates = {
    onCallAvailability: newAvailability,
    timezone: newTimezone,
    modifiedAt: currentDate
  }

  await Promise.all([
    updateAvailabilitySnapshot(user._id, availabilityUpdates),
    VolunteerModel.updateOne({ _id: user._id }, volunteerUpdates)
  ])
}

export async function clearSchedule(
  user: Volunteer,
  tz: string // FIXME: constrain this to official timezones
): Promise<void> {
  const clearedAvailability = _.reduce(
    user.availability,
    (clearedWeek, dayVal, dayKey) => {
      clearedWeek[dayKey] = _.reduce(
        dayVal,
        (clearedDay, hourVal, hourKey) => {
          clearedDay[hourKey] = false
          return clearedDay
        },
        {}
      )
      return clearedWeek
    },
    {}
  )

  await this.updateSchedule({ user, tz, availability: clearedAvailability })
}
