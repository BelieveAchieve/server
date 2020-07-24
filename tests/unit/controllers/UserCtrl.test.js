const Volunteer = require('../../../models/Volunteer')
const UserCtrl = require('../../../controllers/UserCtrl')
const {
  flexibleHoursSelected,
  noHoursSelected,
  allHoursSelected
} = require('../../mocks/volunteer-availability')

const goodUser = new Volunteer({
  email: 'email@email.com',
  password: 'password',

  verified: true,
  verificationToken: 'verificationToken',
  passwordResetToken: 'passwordResetToken',

  // Profile data
  firstname: 'firstname',
  lastname: 'lastname',
  phone: 5555555555,

  favoriteAcademicSubject: 'favoriteAcademicSubject',
  college: 'college',

  availability: {
    Sunday: {
      '12a': false,
      '1a': false,
      '2a': false,
      '3a': false,
      '4a': false,
      '5a': false,
      '6a': false,
      '7a': false,
      '8a': false,
      '9a': false,
      '10a': false,
      '11a': false,
      '12p': false,
      '1p': false,
      '2p': false,
      '3p': false,
      '4p': false,
      '5p': false,
      '6p': false,
      '7p': false,
      '8p': false,
      '9p': false,
      '10p': false,
      '11p': false
    },
    Monday: {
      '12a': false,
      '1a': false,
      '2a': false,
      '3a': false,
      '4a': false,
      '5a': false,
      '6a': false,
      '7a': false,
      '8a': false,
      '9a': false,
      '10a': false,
      '11a': false,
      '12p': false,
      '1p': false,
      '2p': false,
      '3p': false,
      '4p': false,
      '5p': false,
      '6p': false,
      '7p': false,
      '8p': false,
      '9p': false,
      '10p': false,
      '11p': false
    },
    Tuesday: {
      '12a': false,
      '1a': false,
      '2a': false,
      '3a': false,
      '4a': false,
      '5a': false,
      '6a': false,
      '7a': false,
      '8a': false,
      '9a': false,
      '10a': false,
      '11a': false,
      '12p': false,
      '1p': false,
      '2p': false,
      '3p': false,
      '4p': false,
      '5p': false,
      '6p': false,
      '7p': false,
      '8p': false,
      '9p': false,
      '10p': false,
      '11p': false
    },
    Wednesday: {
      '12a': false,
      '1a': false,
      '2a': false,
      '3a': false,
      '4a': false,
      '5a': false,
      '6a': false,
      '7a': false,
      '8a': false,
      '9a': false,
      '10a': false,
      '11a': false,
      '12p': false,
      '1p': false,
      '2p': false,
      '3p': false,
      '4p': false,
      '5p': false,
      '6p': false,
      '7p': false,
      '8p': false,
      '9p': false,
      '10p': false,
      '11p': false
    },
    Thursday: {
      '12a': false,
      '1a': false,
      '2a': false,
      '3a': false,
      '4a': false,
      '5a': false,
      '6a': false,
      '7a': false,
      '8a': false,
      '9a': false,
      '10a': false,
      '11a': false,
      '12p': false,
      '1p': false,
      '2p': false,
      '3p': false,
      '4p': false,
      '5p': false,
      '6p': false,
      '7p': false,
      '8p': false,
      '9p': false,
      '10p': false,
      '11p': false
    },
    Friday: {
      '12a': false,
      '1a': false,
      '2a': false,
      '3a': false,
      '4a': false,
      '5a': false,
      '6a': false,
      '7a': false,
      '8a': false,
      '9a': false,
      '10a': false,
      '11a': false,
      '12p': false,
      '1p': false,
      '2p': false,
      '3p': false,
      '4p': false,
      '5p': false,
      '6p': false,
      '7p': false,
      '8p': false,
      '9p': false,
      '10p': false,
      '11p': false
    },
    Saturday: {
      '12a': true,
      '1a': true,
      '2a': true,
      '3a': true,
      '4a': true,
      '5a': true,
      '6a': true,
      '7a': true,
      '8a': true,
      '9a': true,
      '10a': true,
      '11a': true,
      '12p': true,
      '1p': true,
      '2p': true,
      '3p': true,
      '4p': true,
      '5p': true,
      '6p': true,
      '7p': true,
      '8p': true,
      '9p': true,
      '10p': true,
      '11p': true
    }
  },
  timezone: 'EST',
  pastSessions: null
})

test('Elapsed availability for partially onboarded users', () => {
  // EST Time Zone for dates
  const lastModifiedDate = '2020-02-06T00:52:59.538-05:00'
  const newModifiedDate = '2020-02-09T12:40:00.000-05:00'
  const expected = 0
  goodUser.availability = flexibleHoursSelected
  goodUser.availabilityLastModifiedAt = lastModifiedDate
  const result = UserCtrl.calculateElapsedAvailability(
    goodUser.toObject(),
    newModifiedDate
  )
  expect(expected).toBe(result)
})

test('Elapsed availability over 3 days with no hours available', () => {
  // EST Time Zone for dates
  const lastModifiedDate = '2020-02-06T12:52:59.538-05:00'
  const newModifiedDate = '2020-02-09T13:40:00.000-05:00'
  const expected = 0
  goodUser.availability = noHoursSelected
  goodUser.availabilityLastModifiedAt = lastModifiedDate
  const result = UserCtrl.calculateElapsedAvailability(
    goodUser.toObject(),
    newModifiedDate
  )
  expect(expected).toBe(result)
})

test('Elapsed availability over 3 days with all hours available and 7 hours out of range', () => {
  // EST Time Zone for dates
  const lastModifiedDate = '2020-02-06T00:52:59.538-05:00'
  const newModifiedDate = '2020-02-09T19:40:00.000-05:00'
  const expected = 90
  goodUser.availability = allHoursSelected
  goodUser.availabilityLastModifiedAt = lastModifiedDate
  // @todo Make Volunteer.test.js with an onboarded and partially onboarded Volunteer
  // Onboard the user
  goodUser.isVolunteer = true
  goodUser.certifications['algebra'].passed = true
  goodUser.isOnboarded = true
  const result = UserCtrl.calculateElapsedAvailability(
    goodUser.toObject(),
    newModifiedDate
  )
  expect(expected).toBe(result)

  // set user back to default
  goodUser.isVolunteer = false
  goodUser.certifications['algebra'].passed = false
  goodUser.isOnboarded = false
})

test('Elapsed availability over 3 days with flexible hours available', () => {
  // EST Time Zone for dates
  const lastModifiedDate = '2020-02-06T00:52:59.538-05:00'
  const newModifiedDate = '2020-02-09T12:40:00.000-05:00'
  const expected = 16
  goodUser.availability = flexibleHoursSelected
  goodUser.availabilityLastModifiedAt = lastModifiedDate
  // @todo Make Volunteer.test.js with an onboarded and partially onboarded Volunteer
  // Onboard the user
  goodUser.isVolunteer = true
  goodUser.certifications['algebra'].passed = true
  goodUser.isOnboarded = true
  const result = UserCtrl.calculateElapsedAvailability(
    goodUser.toObject(),
    newModifiedDate
  )
  expect(expected).toBe(result)

  // set user back to default
  goodUser.isVolunteer = false
  goodUser.certifications['algebra'].passed = false
  goodUser.isOnboarded = false
})

/** 
 * flexibleHoursSelected mapped:
 { Sunday: 3,
  Monday: 6,
  Tuesday: 6,
  Wednesday: 5,
  Thursday: 3,
  Friday: 6,
  Saturday: 5 }
**/
test('Elapsed availability over 23 days with flexible hours available', () => {
  // EST Time Zone for dates
  const lastModifiedDate = '2020-02-02T05:21:39.538-05:00'
  const newModifiedDate = '2020-02-25T16:20:42.000-05:00'
  const expected = 114
  goodUser.availability = flexibleHoursSelected
  goodUser.availabilityLastModifiedAt = lastModifiedDate

  // @todo Make Volunteer.test.js with an onboarded and partially onboarded Volunteer
  // Onboard the user
  goodUser.isVolunteer = true
  goodUser.certifications['algebra'].passed = true
  goodUser.isOnboarded = true
  const result = UserCtrl.calculateElapsedAvailability(
    goodUser.toObject(),
    newModifiedDate
  )
  expect(expected).toBe(result)

  // set user back to default
  goodUser.isVolunteer = false
  goodUser.certifications['algebra'].passed = false
  goodUser.isOnboarded = false
})
