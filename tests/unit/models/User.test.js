const test = require('ava')
const User = require('../../../models/User.js')
const {
  flexibleHoursSelected,
  noHoursSelected,
  allHoursSelected
} = require('../../mocks/volunteer-availability')

const goodUser = new User({
  email: 'email@email.com',
  password: 'password',

  verified: true,
  verificationToken: 'verificationToken',
  registrationCode: 'registrationCode',
  passwordResetToken: 'passwordResetToken',

  // Profile data
  firstname: 'firstname',
  lastname: 'lastname',
  phone: 5555555555,

  favoriteAcademicSubject: 'favoriteAcademicSubject',
  college: 'college',
  heardFrom: 'heardFrom',
  referred: 'referred',

  availability: {
    sunday: {
      0: false,
      1: false,
      2: false,
      3: false,
      4: false,
      5: false,
      6: false,
      7: false,
      8: false,
      9: false,
      10: false,
      11: false,
      12: false,
      13: false,
      14: false,
      15: false,
      16: false,
      17: false,
      18: false,
      19: false,
      20: false,
      21: false,
      22: false,
      23: false
    },
    monday: {
      0: false,
      1: false,
      2: false,
      3: false,
      4: false,
      5: false,
      6: false,
      7: false,
      8: false,
      9: false,
      10: false,
      11: false,
      12: false,
      13: false,
      14: false,
      15: false,
      16: false,
      17: false,
      18: false,
      19: false,
      20: false,
      21: false,
      22: false,
      23: false
    },
    tuesday: {
      0: false,
      1: false,
      2: false,
      3: false,
      4: false,
      5: false,
      6: false,
      7: false,
      8: false,
      9: false,
      10: false,
      11: false,
      12: false,
      13: false,
      14: false,
      15: false,
      16: false,
      17: false,
      18: false,
      19: false,
      20: false,
      21: false,
      22: false,
      23: false
    },
    wednesday: {
      0: false,
      1: false,
      2: false,
      3: false,
      4: false,
      5: false,
      6: false,
      7: false,
      8: false,
      9: false,
      10: false,
      11: false,
      12: false,
      13: false,
      14: false,
      15: false,
      16: false,
      17: false,
      18: false,
      19: false,
      20: false,
      21: false,
      22: false,
      23: false
    },
    thursday: {
      0: false,
      1: false,
      2: false,
      3: false,
      4: false,
      5: false,
      6: false,
      7: false,
      8: false,
      9: false,
      10: false,
      11: false,
      12: false,
      13: false,
      14: false,
      15: false,
      16: false,
      17: false,
      18: false,
      19: false,
      20: false,
      21: false,
      22: false,
      23: false
    },
    friday: {
      0: false,
      1: false,
      2: false,
      3: false,
      4: false,
      5: false,
      6: false,
      7: false,
      8: false,
      9: false,
      10: false,
      11: false,
      12: false,
      13: false,
      14: false,
      15: false,
      16: false,
      17: false,
      18: false,
      19: false,
      20: false,
      21: false,
      22: false,
      23: false
    },
    saturday: {
      0: true,
      1: true,
      2: true,
      3: true,
      4: true,
      5: true,
      6: true,
      7: true,
      8: true,
      9: true,
      10: true,
      11: true,
      12: true,
      13: true,
      14: true,
      15: true,
      16: true,
      17: true,
      18: true,
      19: true,
      20: true,
      21: true,
      22: true,
      23: true
    }
  },
  timezone: 'EST',
  pastSessions: null
})

test('Test parsed profile Object', t => {
  const parsedData = goodUser.parseProfile()

  t.is(parsedData, parsedData)
  t.is(parsedData.email, 'email@email.com')
  t.is(parsedData.verified, true)
  t.is(parsedData.firstname, 'firstname')
  t.is(parsedData.lastname, 'lastname')
  t.is(parsedData.isVolunteer, false)
  t.is(parsedData.isAdmin, false)
  t.is(parsedData.referred, 'referred')
  t.is(parsedData.phone, '5555555555')

  t.is(parsedData.availability.sunday[0], false)
  t.is(parsedData.availability.sunday[1], false)
  t.is(parsedData.availability.sunday[2], false)
  t.is(parsedData.availability.sunday[3], false)
  t.is(parsedData.availability.sunday[4], false)
  t.is(parsedData.availability.sunday[5], false)
  t.is(parsedData.availability.sunday[6], false)
  t.is(parsedData.availability.sunday[7], false)
  t.is(parsedData.availability.sunday[8], false)
  t.is(parsedData.availability.sunday[9], false)
  t.is(parsedData.availability.sunday[10], false)
  t.is(parsedData.availability.sunday[11], false)
  t.is(parsedData.availability.sunday[12], false)
  t.is(parsedData.availability.sunday[13], false)
  t.is(parsedData.availability.sunday[14], false)
  t.is(parsedData.availability.sunday[15], false)
  t.is(parsedData.availability.sunday[16], false)
  t.is(parsedData.availability.sunday[17], false)
  t.is(parsedData.availability.sunday[18], false)
  t.is(parsedData.availability.sunday[19], false)
  t.is(parsedData.availability.sunday[20], false)
  t.is(parsedData.availability.sunday[21], false)
  t.is(parsedData.availability.sunday[22], false)
  t.is(parsedData.availability.sunday[23], false)

  t.is(parsedData.availability.monday[0], false)
  t.is(parsedData.availability.monday[1], false)
  t.is(parsedData.availability.monday[2], false)
  t.is(parsedData.availability.monday[3], false)
  t.is(parsedData.availability.monday[4], false)
  t.is(parsedData.availability.monday[5], false)
  t.is(parsedData.availability.monday[6], false)
  t.is(parsedData.availability.monday[7], false)
  t.is(parsedData.availability.monday[8], false)
  t.is(parsedData.availability.monday[9], false)
  t.is(parsedData.availability.monday[10], false)
  t.is(parsedData.availability.monday[11], false)
  t.is(parsedData.availability.monday[12], false)
  t.is(parsedData.availability.monday[13], false)
  t.is(parsedData.availability.monday[14], false)
  t.is(parsedData.availability.monday[15], false)
  t.is(parsedData.availability.monday[16], false)
  t.is(parsedData.availability.monday[17], false)
  t.is(parsedData.availability.monday[18], false)
  t.is(parsedData.availability.monday[19], false)
  t.is(parsedData.availability.monday[20], false)
  t.is(parsedData.availability.monday[21], false)
  t.is(parsedData.availability.monday[22], false)
  t.is(parsedData.availability.monday[23], false)

  t.is(parsedData.availability.tuesday[0], false)
  t.is(parsedData.availability.tuesday[1], false)
  t.is(parsedData.availability.tuesday[2], false)
  t.is(parsedData.availability.tuesday[3], false)
  t.is(parsedData.availability.tuesday[4], false)
  t.is(parsedData.availability.tuesday[5], false)
  t.is(parsedData.availability.tuesday[6], false)
  t.is(parsedData.availability.tuesday[7], false)
  t.is(parsedData.availability.tuesday[8], false)
  t.is(parsedData.availability.tuesday[9], false)
  t.is(parsedData.availability.tuesday[10], false)
  t.is(parsedData.availability.tuesday[11], false)
  t.is(parsedData.availability.tuesday[12], false)
  t.is(parsedData.availability.tuesday[13], false)
  t.is(parsedData.availability.tuesday[14], false)
  t.is(parsedData.availability.tuesday[15], false)
  t.is(parsedData.availability.tuesday[16], false)
  t.is(parsedData.availability.tuesday[17], false)
  t.is(parsedData.availability.tuesday[18], false)
  t.is(parsedData.availability.tuesday[19], false)
  t.is(parsedData.availability.tuesday[20], false)
  t.is(parsedData.availability.tuesday[21], false)
  t.is(parsedData.availability.tuesday[22], false)
  t.is(parsedData.availability.tuesday[23], false)

  t.is(parsedData.availability.wednesday[0], false)
  t.is(parsedData.availability.wednesday[1], false)
  t.is(parsedData.availability.wednesday[2], false)
  t.is(parsedData.availability.wednesday[3], false)
  t.is(parsedData.availability.wednesday[4], false)
  t.is(parsedData.availability.wednesday[5], false)
  t.is(parsedData.availability.wednesday[6], false)
  t.is(parsedData.availability.wednesday[7], false)
  t.is(parsedData.availability.wednesday[8], false)
  t.is(parsedData.availability.wednesday[9], false)
  t.is(parsedData.availability.wednesday[10], false)
  t.is(parsedData.availability.wednesday[11], false)
  t.is(parsedData.availability.wednesday[12], false)
  t.is(parsedData.availability.wednesday[13], false)
  t.is(parsedData.availability.wednesday[14], false)
  t.is(parsedData.availability.wednesday[15], false)
  t.is(parsedData.availability.wednesday[16], false)
  t.is(parsedData.availability.wednesday[17], false)
  t.is(parsedData.availability.wednesday[18], false)
  t.is(parsedData.availability.wednesday[19], false)
  t.is(parsedData.availability.wednesday[20], false)
  t.is(parsedData.availability.wednesday[21], false)
  t.is(parsedData.availability.wednesday[22], false)
  t.is(parsedData.availability.wednesday[23], false)

  t.is(parsedData.availability.thursday[0], false)
  t.is(parsedData.availability.thursday[1], false)
  t.is(parsedData.availability.thursday[2], false)
  t.is(parsedData.availability.thursday[3], false)
  t.is(parsedData.availability.thursday[4], false)
  t.is(parsedData.availability.thursday[5], false)
  t.is(parsedData.availability.thursday[6], false)
  t.is(parsedData.availability.thursday[7], false)
  t.is(parsedData.availability.thursday[8], false)
  t.is(parsedData.availability.thursday[9], false)
  t.is(parsedData.availability.thursday[10], false)
  t.is(parsedData.availability.thursday[11], false)
  t.is(parsedData.availability.thursday[12], false)
  t.is(parsedData.availability.thursday[13], false)
  t.is(parsedData.availability.thursday[14], false)
  t.is(parsedData.availability.thursday[15], false)
  t.is(parsedData.availability.thursday[16], false)
  t.is(parsedData.availability.thursday[17], false)
  t.is(parsedData.availability.thursday[18], false)
  t.is(parsedData.availability.thursday[19], false)
  t.is(parsedData.availability.thursday[20], false)
  t.is(parsedData.availability.thursday[21], false)
  t.is(parsedData.availability.thursday[22], false)
  t.is(parsedData.availability.thursday[23], false)

  t.is(parsedData.availability.friday[0], false)
  t.is(parsedData.availability.friday[1], false)
  t.is(parsedData.availability.friday[2], false)
  t.is(parsedData.availability.friday[3], false)
  t.is(parsedData.availability.friday[4], false)
  t.is(parsedData.availability.friday[5], false)
  t.is(parsedData.availability.friday[6], false)
  t.is(parsedData.availability.friday[7], false)
  t.is(parsedData.availability.friday[8], false)
  t.is(parsedData.availability.friday[9], false)
  t.is(parsedData.availability.friday[10], false)
  t.is(parsedData.availability.friday[11], false)
  t.is(parsedData.availability.friday[12], false)
  t.is(parsedData.availability.friday[13], false)
  t.is(parsedData.availability.friday[14], false)
  t.is(parsedData.availability.friday[15], false)
  t.is(parsedData.availability.friday[16], false)
  t.is(parsedData.availability.friday[17], false)
  t.is(parsedData.availability.friday[18], false)
  t.is(parsedData.availability.friday[19], false)
  t.is(parsedData.availability.friday[20], false)
  t.is(parsedData.availability.friday[21], false)
  t.is(parsedData.availability.friday[22], false)
  t.is(parsedData.availability.friday[23], false)

  t.is(parsedData.availability.saturday[0], true)
  t.is(parsedData.availability.saturday[1], true)
  t.is(parsedData.availability.saturday[2], true)
  t.is(parsedData.availability.saturday[3], true)
  t.is(parsedData.availability.saturday[4], true)
  t.is(parsedData.availability.saturday[5], true)
  t.is(parsedData.availability.saturday[6], true)
  t.is(parsedData.availability.saturday[7], true)
  t.is(parsedData.availability.saturday[8], true)
  t.is(parsedData.availability.saturday[9], true)
  t.is(parsedData.availability.saturday[10], true)
  t.is(parsedData.availability.saturday[11], true)
  t.is(parsedData.availability.saturday[12], true)
  t.is(parsedData.availability.saturday[13], true)
  t.is(parsedData.availability.saturday[14], true)
  t.is(parsedData.availability.saturday[15], true)
  t.is(parsedData.availability.saturday[16], true)
  t.is(parsedData.availability.saturday[17], true)
  t.is(parsedData.availability.saturday[18], true)
  t.is(parsedData.availability.saturday[19], true)
  t.is(parsedData.availability.saturday[20], true)
  t.is(parsedData.availability.saturday[21], true)
  t.is(parsedData.availability.saturday[22], true)
  t.is(parsedData.availability.saturday[23], true)
  t.is(parsedData.timezone, 'EST')
  t.is(parsedData.college, 'college')
  t.is(parsedData.favoriteAcademicSubject, 'favoriteAcademicSubject')
  t.is(parsedData.heardFrom, 'heardFrom')
  t.is(parsedData.isFakeUser, false)
  t.is(parsedData.password, undefined)
  t.is(parsedData.phonePretty, '555-555-5555')
  t.is(parsedData.numPastSessions, 0)
  t.is(parsedData.numVolunteerSessionHours, 0)
  t.is(parsedData.mathCoachingOnly, null)
  t.is(parsedData.certifications['prealgebra'].passed, false)
  t.is(parsedData.certifications['algebra'].passed, false)
  t.is(parsedData.certifications['geometry'].passed, false)
  t.is(parsedData.certifications['trigonometry'].passed, false)
  t.is(parsedData.certifications['precalculus'].passed, false)
  t.is(parsedData.certifications['calculus'].passed, false)
  t.is(parsedData.certifications['applications'].passed, false)
  t.is(parsedData.certifications['essays'].passed, false)
  t.is(parsedData.certifications['planning'].passed, false)
  t.is(parsedData.certifications['prealgebra'].tries, 0)
  t.is(parsedData.certifications['algebra'].tries, 0)
  t.is(parsedData.certifications['geometry'].tries, 0)
  t.is(parsedData.certifications['trigonometry'].tries, 0)
  t.is(parsedData.certifications['precalculus'].tries, 0)
  t.is(parsedData.certifications['calculus'].tries, 0)
  t.is(parsedData.certifications['applications'].tries, 0)
  t.is(parsedData.certifications['essays'].tries, 0)
  t.is(parsedData.certifications['planning'].tries, 0)
})

test('Phone does not match format', t => {
  goodUser.phonePretty = '222222222'
  const test = goodUser.phonePretty
  t.is(test, null)
})

test('Phone format matches', t => {
  goodUser.phonePretty = '555-555-5555'
  t.is(goodUser.phonePretty, '555-555-5555')
})

test('Setting phone to null', t => {
  goodUser.phone = null
  t.is(goodUser.phonePretty, null)
})

test('Test international phone number', t => {
  goodUser.phone = '+123456790'
  const tempPhone = goodUser.phonePretty
  t.is(tempPhone, '+123456790')
})

test('Elapsed availability over 3 days with no hours available', t => {
  // EST Time Zone for dates
  const lastModifiedDate = '2020-02-06T12:52:59.538-05:00'
  const newModifiedDate = '2020-02-09T13:40:00.000-05:00'
  const expected = 0
  goodUser.availability = noHoursSelected
  goodUser.availabilityLastModifiedAt = lastModifiedDate
  const result = goodUser.calculateElapsedAvailability(newModifiedDate)
  t.is(expected, result)
})

test('Elapsed availability over 3 days with all hours available and 7 hours out of range', async t => {
  // EST Time Zone for dates
  const lastModifiedDate = '2020-02-06T00:52:59.538-05:00'
  const newModifiedDate = '2020-02-09T19:40:00.000-05:00'
  const expected = 90
  goodUser.availability = allHoursSelected
  goodUser.availabilityLastModifiedAt = lastModifiedDate
  const result = goodUser.calculateElapsedAvailability(newModifiedDate)
  t.is(expected, result)
})

test('Elapsed availability over 3 days with flexible hours available', async t => {
  // EST Time Zone for dates
  const lastModifiedDate = '2020-02-06T00:52:59.538-05:00'
  const newModifiedDate = '2020-02-09T12:40:00.000-05:00'
  const expected = 16
  goodUser.availability = flexibleHoursSelected
  goodUser.availabilityLastModifiedAt = lastModifiedDate
  const result = goodUser.calculateElapsedAvailability(newModifiedDate)
  t.is(expected, result)
})

/** 
 * flexibleHoursSelected mapped:
 { sunday: 3,
  monday: 6,
  tuesday: 6,
  wednesday: 5,
  thursday: 3,
  friday: 6,
  saturday: 5 }
**/
test('Elapsed availability over 23 days with flexible hours available', async t => {
  // EST Time Zone for dates
  const lastModifiedDate = '2020-02-02T05:21:39.538-05:00'
  const newModifiedDate = '2020-02-25T16:20:42.000-05:00'
  const expected = 114
  goodUser.availability = flexibleHoursSelected
  goodUser.availabilityLastModifiedAt = lastModifiedDate
  const result = goodUser.calculateElapsedAvailability(newModifiedDate)
  t.is(expected, result)
})
