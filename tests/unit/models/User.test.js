const test = require('ava')
const User = require('../../../models/User.js')

const goodUser = new User({

	email: 'email@email.com',
  password: "password",

  verified:true,
  verificationToken: 'verificationToken',
  registrationCode: 'registrationCode',
  passwordResetToken: 'passwordResetToken',

  // Profile data
  firstname: 'firstname',
  lastname: 'lastname',
  nickname: 'nickname',
  serviceInterests: ['serviceInterests'],
  picture: 'picture',
  birthdate: 'birthdate',
  gender: 'gender',
  race: ['race'],
  groupIdentification: ['groupId'],
  computerAccess: ['computerAccess'],
  preferredTimes: ['10:00am'],
  phone: 5555555555,
  currentGrade: 'currentGrade',
  expectedGraduation: 'expectedGraduation',
  difficultAcademicSubject: 'difficultAcademicSubject',

  difficultCollegeProcess: ['difficultCollegeProcess'],
  highestLevelEducation: ['highestLevelEducation'],
  hasGuidanceCounselor: 'hasGuidanceCounselor',
  favoriteAcademicSubject: 'favoriteAcademicSubject',
  gpa: 'gpa',
  collegeApplicationsText: 'collegeApplicationsText',
  commonCollegeDocs: ['commonCollegeDocs'],
  college: 'college',
  academicInterestsText: 'academicInterestsText',
  testScoresText: 'testScoresText',
  advancedCoursesText: 'advancedCoursesText',
  extracurricularActivitesText: 'extracurricularActivitesText',
  heardFrom: 'heardFrom',
  referred: 'referred',
  preferredContactMethod: ['preferredContactMethod'],

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
  hasSchedule: false,
  timezone: "EST",
  pastSessions: null
})


test('Test parsed profile Object', t => {
	const parsedData = goodUser.parseProfile()

  t.is(parsedData, parsedData)
  t.is(parsedData.email, 'email@email.com')
  t.is(parsedData.verified, true)
  t.is(parsedData.firstname, 'firstname')
  t.is(parsedData.lastname, 'lastname')
  t.is(parsedData.nickname, 'nickname')
  t.is(parsedData.picture, 'picture')
  t.is(parsedData.isVolunteer, false)
  t.is(parsedData.isAdmin, false)
	t.is(parsedData.referred, 'referred')
  //  t.is(parsedData.createdAt, false)
	t.is(parsedData.birthdate, 'birthdate')
	t.is(parsedData.serviceInterests[0], 'serviceInterests')
	t.is(parsedData.gender, 'gender')
  	t.is(parsedData.race[0], 'race')
	t.is(parsedData.groupIdentification[0], 'groupId')
	t.is(parsedData.computerAccess[0], 'computerAccess')
	t.is(parsedData.preferredTimes[0], '10:00am')
  t.is(parsedData.phone, '5555555555')

  t.is(parsedData.preferredContactMethod[0], 'preferredContactMethod')


	t.is(parsedData.availability.Sunday["12a"], false)
  t.is(parsedData.availability.Sunday["1a"], false)
  t.is(parsedData.availability.Sunday["2a"], false)
  t.is(parsedData.availability.Sunday["3a"], false)
  t.is(parsedData.availability.Sunday["4a"], false)
  t.is(parsedData.availability.Sunday["5a"], false)
  t.is(parsedData.availability.Sunday["6a"], false)
  t.is(parsedData.availability.Sunday["7a"], false)
  t.is(parsedData.availability.Sunday["8a"], false)
  t.is(parsedData.availability.Sunday["9a"], false)
  t.is(parsedData.availability.Sunday["10a"], false)
  t.is(parsedData.availability.Sunday["11a"], false)
  t.is(parsedData.availability.Sunday["12p"], false)
  t.is(parsedData.availability.Sunday["1p"], false)
  t.is(parsedData.availability.Sunday["2p"], false)
  t.is(parsedData.availability.Sunday["3p"], false)
  t.is(parsedData.availability.Sunday["4p"], false)
  t.is(parsedData.availability.Sunday["5p"], false)
  t.is(parsedData.availability.Sunday["6p"], false)
  t.is(parsedData.availability.Sunday["7p"], false)
  t.is(parsedData.availability.Sunday["8p"], false)
  t.is(parsedData.availability.Sunday["9p"], false)
  t.is(parsedData.availability.Sunday["10p"], false)
  t.is(parsedData.availability.Sunday["11p"], false)

  t.is(parsedData.availability.Monday["12a"], false)
  t.is(parsedData.availability.Monday["1a"], false)
  t.is(parsedData.availability.Monday["2a"], false)
  t.is(parsedData.availability.Monday["3a"], false)
  t.is(parsedData.availability.Monday["4a"], false)
  t.is(parsedData.availability.Monday["5a"], false)
  t.is(parsedData.availability.Monday["6a"], false)
  t.is(parsedData.availability.Monday["7a"], false)
  t.is(parsedData.availability.Monday["8a"], false)
  t.is(parsedData.availability.Monday["9a"], false)
  t.is(parsedData.availability.Monday["10a"], false)
  t.is(parsedData.availability.Monday["11a"], false)
  t.is(parsedData.availability.Monday["12p"], false)
  t.is(parsedData.availability.Monday["1p"], false)
  t.is(parsedData.availability.Monday["2p"], false)
  t.is(parsedData.availability.Monday["3p"], false)
  t.is(parsedData.availability.Monday["4p"], false)
  t.is(parsedData.availability.Monday["5p"], false)
  t.is(parsedData.availability.Monday["6p"], false)
  t.is(parsedData.availability.Monday["7p"], false)
  t.is(parsedData.availability.Monday["8p"], false)
  t.is(parsedData.availability.Monday["9p"], false)
  t.is(parsedData.availability.Monday["10p"], false)
  t.is(parsedData.availability.Monday["11p"], false)

  t.is(parsedData.availability.Tuesday["12a"], false)
  t.is(parsedData.availability.Tuesday["1a"], false)
  t.is(parsedData.availability.Tuesday["2a"], false)
  t.is(parsedData.availability.Tuesday["3a"], false)
  t.is(parsedData.availability.Tuesday["4a"], false)
  t.is(parsedData.availability.Tuesday["5a"], false)
  t.is(parsedData.availability.Tuesday["6a"], false)
  t.is(parsedData.availability.Tuesday["7a"], false)
  t.is(parsedData.availability.Tuesday["8a"], false)
  t.is(parsedData.availability.Tuesday["9a"], false)
  t.is(parsedData.availability.Tuesday["10a"], false)
  t.is(parsedData.availability.Tuesday["11a"], false)
  t.is(parsedData.availability.Tuesday["12p"], false)
  t.is(parsedData.availability.Tuesday["1p"], false)
  t.is(parsedData.availability.Tuesday["2p"], false)
  t.is(parsedData.availability.Tuesday["3p"], false)
  t.is(parsedData.availability.Tuesday["4p"], false)
  t.is(parsedData.availability.Tuesday["5p"], false)
  t.is(parsedData.availability.Tuesday["6p"], false)
  t.is(parsedData.availability.Tuesday["7p"], false)
  t.is(parsedData.availability.Tuesday["8p"], false)
  t.is(parsedData.availability.Tuesday["9p"], false)
  t.is(parsedData.availability.Tuesday["10p"], false)
  t.is(parsedData.availability.Tuesday["11p"], false)
  
  t.is(parsedData.availability.Wednesday["12a"], false)
  t.is(parsedData.availability.Wednesday["1a"], false)
  t.is(parsedData.availability.Wednesday["2a"], false)
  t.is(parsedData.availability.Wednesday["3a"], false)
  t.is(parsedData.availability.Wednesday["4a"], false)
  t.is(parsedData.availability.Wednesday["5a"], false)
  t.is(parsedData.availability.Wednesday["6a"], false)
  t.is(parsedData.availability.Wednesday["7a"], false)
  t.is(parsedData.availability.Wednesday["8a"], false)
  t.is(parsedData.availability.Wednesday["9a"], false)
  t.is(parsedData.availability.Wednesday["10a"], false)
  t.is(parsedData.availability.Wednesday["11a"], false)
  t.is(parsedData.availability.Wednesday["12p"], false)
  t.is(parsedData.availability.Wednesday["1p"], false)
  t.is(parsedData.availability.Wednesday["2p"], false)
  t.is(parsedData.availability.Wednesday["3p"], false)
  t.is(parsedData.availability.Wednesday["4p"], false)
  t.is(parsedData.availability.Wednesday["5p"], false)
  t.is(parsedData.availability.Wednesday["6p"], false)
  t.is(parsedData.availability.Wednesday["7p"], false)
  t.is(parsedData.availability.Wednesday["8p"], false)
  t.is(parsedData.availability.Wednesday["9p"], false)
  t.is(parsedData.availability.Wednesday["10p"], false)
  t.is(parsedData.availability.Wednesday["11p"], false)

  t.is(parsedData.availability.Thursday["12a"], false)
  t.is(parsedData.availability.Thursday["1a"], false)
  t.is(parsedData.availability.Thursday["2a"], false)
  t.is(parsedData.availability.Thursday["3a"], false)
  t.is(parsedData.availability.Thursday["4a"], false)
  t.is(parsedData.availability.Thursday["5a"], false)
  t.is(parsedData.availability.Thursday["6a"], false)
  t.is(parsedData.availability.Thursday["7a"], false)
  t.is(parsedData.availability.Thursday["8a"], false)
  t.is(parsedData.availability.Thursday["9a"], false)
  t.is(parsedData.availability.Thursday["10a"], false)
  t.is(parsedData.availability.Thursday["11a"], false)
  t.is(parsedData.availability.Thursday["12p"], false)
  t.is(parsedData.availability.Thursday["1p"], false)
  t.is(parsedData.availability.Thursday["2p"], false)
  t.is(parsedData.availability.Thursday["3p"], false)
  t.is(parsedData.availability.Thursday["4p"], false)
  t.is(parsedData.availability.Thursday["5p"], false)
  t.is(parsedData.availability.Thursday["6p"], false)
  t.is(parsedData.availability.Thursday["7p"], false)
  t.is(parsedData.availability.Thursday["8p"], false)
  t.is(parsedData.availability.Thursday["9p"], false)
  t.is(parsedData.availability.Thursday["10p"], false)
  t.is(parsedData.availability.Thursday["11p"], false)
  
  t.is(parsedData.availability.Friday["12a"], false)
  t.is(parsedData.availability.Friday["1a"], false)
  t.is(parsedData.availability.Friday["2a"], false)
  t.is(parsedData.availability.Friday["3a"], false)
  t.is(parsedData.availability.Friday["4a"], false)
  t.is(parsedData.availability.Friday["5a"], false)
  t.is(parsedData.availability.Friday["6a"], false)
  t.is(parsedData.availability.Friday["7a"], false)
  t.is(parsedData.availability.Friday["8a"], false)
  t.is(parsedData.availability.Friday["9a"], false)
  t.is(parsedData.availability.Friday["10a"], false)
  t.is(parsedData.availability.Friday["11a"], false)
  t.is(parsedData.availability.Friday["12p"], false)
  t.is(parsedData.availability.Friday["1p"], false)
  t.is(parsedData.availability.Friday["2p"], false)
  t.is(parsedData.availability.Friday["3p"], false)
  t.is(parsedData.availability.Friday["4p"], false)
  t.is(parsedData.availability.Friday["5p"], false)
  t.is(parsedData.availability.Friday["6p"], false)
  t.is(parsedData.availability.Friday["7p"], false)
  t.is(parsedData.availability.Friday["8p"], false)
  t.is(parsedData.availability.Friday["9p"], false)
  t.is(parsedData.availability.Friday["10p"], false)
  t.is(parsedData.availability.Friday["11p"], false)

  t.is(parsedData.availability.Saturday["12a"], true)
  t.is(parsedData.availability.Saturday["1a"], true)
  t.is(parsedData.availability.Saturday["2a"], true)
  t.is(parsedData.availability.Saturday["3a"], true)
  t.is(parsedData.availability.Saturday["4a"], true)
  t.is(parsedData.availability.Saturday["5a"], true)
  t.is(parsedData.availability.Saturday["6a"], true)
  t.is(parsedData.availability.Saturday["7a"], true)
  t.is(parsedData.availability.Saturday["8a"], true)
  t.is(parsedData.availability.Saturday["9a"], true)
  t.is(parsedData.availability.Saturday["10a"], true)
  t.is(parsedData.availability.Saturday["11a"], true)
  t.is(parsedData.availability.Saturday["12p"], true)
  t.is(parsedData.availability.Saturday["1p"], true)
  t.is(parsedData.availability.Saturday["2p"], true)
  t.is(parsedData.availability.Saturday["3p"], true)
  t.is(parsedData.availability.Saturday["4p"], true)
  t.is(parsedData.availability.Saturday["5p"], true)
  t.is(parsedData.availability.Saturday["6p"], true)
  t.is(parsedData.availability.Saturday["7p"], true)
  t.is(parsedData.availability.Saturday["8p"], true)
  t.is(parsedData.availability.Saturday["9p"], true)
  t.is(parsedData.availability.Saturday["10p"], true)
  t.is(parsedData.availability.Saturday["11p"], true)
	t.is(parsedData.hasSchedule, false)
  t.is(parsedData.timezone, 'EST')
	t.is(parsedData.currentGrade, 'currentGrade')
	t.is(parsedData.expectedGraduation, 'expectedGraduation')
	t.is(parsedData.difficultAcademicSubject, 'difficultAcademicSubject')
	t.is(parsedData.difficultCollegeProcess[0], 'difficultCollegeProcess')
	t.is(parsedData.highestLevelEducation[0], 'highestLevelEducation')
	t.is(parsedData.hasGuidanceCounselor, 'hasGuidanceCounselor')
	t.is(parsedData.gpa, 'gpa')
	t.is(parsedData.college, 'college')
	t.is(parsedData.collegeApplicationsText, 'collegeApplicationsText')
	t.is(parsedData.commonCollegeDocs[0], 'commonCollegeDocs')
	t.is(parsedData.academicInterestsText, 'academicInterestsText')
	t.is(parsedData.testScoresText, 'testScoresText')
	t.is(parsedData.advancedCoursesText, 'advancedCoursesText')
	t.is(parsedData.extracurricularActivitesText, 'extracurricularActivitesText')
	t.is(parsedData.favoriteAcademicSubject, 'favoriteAcademicSubject')
	t.is(parsedData.heardFrom, 'heardFrom')
	t.is(parsedData.isFakeUser, false)
  t.is(parsedData.password, undefined)
  t.is(parsedData.phonePretty, '555-555-5555')
  t.is(parsedData.numPastSessions, 0)
  t.is(parsedData.numVolunteerSessionHours, 0)
  t.is(parsedData.mathCoachingOnly, null)
  t.is(parsedData.certifications['algebra'].passed, false)
  t.is(parsedData.certifications['geometry'].passed, false)
  t.is(parsedData.certifications['trigonometry'].passed, false)
  t.is(parsedData.certifications['precalculus'].passed, false)
  t.is(parsedData.certifications['calculus'].passed, false)
  t.is(parsedData.certifications['applications'].passed, false)
  t.is(parsedData.certifications['essays'].passed, false)
  t.is(parsedData.certifications['planning'].passed, false)
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
  goodUser.phone = "+123456790"  
  const tempPhone = goodUser.phonePretty
  t.is(tempPhone, "+123456790")
})
