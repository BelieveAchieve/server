const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const validator = require('validator')
const moment = require('moment-timezone')
const countAvailabilityHours = require('../utils/count-availability-hours')
const removeTimeFromDate = require('../utils/remove-time-from-date')
const getFrequencyOfDays = require('../utils/get-frequency-of-days')
const calculateTotalHours = require('../utils/calculate-total-hours')
const countOutOfRangeHours = require('../utils/count-out-of-range-hours')

const config = require('../config.js')

const weeksSince = date => {
  // 604800000 = milliseconds in a week
  return (new Date() - date) / 604800000
}

const minsSince = date => {
  // 60000 = milliseconds in a minute
  return (new Date() - date) / 60000
}

const tallyVolunteerPoints = volunteer => {
  let points = 0

  // +2 points if no past sessions
  if (!volunteer.numPastSessions) {
    points += 2
  }

  // +1 point if volunteer is from a partner org
  if (volunteer.volunteerPartnerOrg) {
    points += 1
  }

  // +1 point per 1 week since last notification
  if (volunteer.volunteerLastNotification) {
    points += weeksSince(new Date(volunteer.volunteerLastNotification.sentAt))
  } else {
    points += weeksSince(new Date(volunteer.createdAt))
  }

  // +1 point per 2 weeks since last session
  if (volunteer.volunteerLastSession) {
    points +=
      0.5 * weeksSince(new Date(volunteer.volunteerLastSession.createdAt))
  } else {
    points += weeksSince(new Date(volunteer.createdAt))
  }

  // -10000 points if notified recently
  if (
    volunteer.volunteerLastNotification &&
    minsSince(new Date(volunteer.volunteerLastNotification.sentAt)) < 5
  ) {
    points -= 10000
  }

  return parseFloat(points.toFixed(2))
}

// subdocument schema for each availability day
const availabilityDaySchema = new mongoose.Schema(
  {
    '12a': { type: Boolean, default: false },
    '1a': { type: Boolean, default: false },
    '2a': { type: Boolean, default: false },
    '3a': { type: Boolean, default: false },
    '4a': { type: Boolean, default: false },
    '5a': { type: Boolean, default: false },
    '6a': { type: Boolean, default: false },
    '7a': { type: Boolean, default: false },
    '8a': { type: Boolean, default: false },
    '9a': { type: Boolean, default: false },
    '10a': { type: Boolean, default: false },
    '11a': { type: Boolean, default: false },
    '12p': { type: Boolean, default: false },
    '1p': { type: Boolean, default: false },
    '2p': { type: Boolean, default: false },
    '3p': { type: Boolean, default: false },
    '4p': { type: Boolean, default: false },
    '5p': { type: Boolean, default: false },
    '6p': { type: Boolean, default: false },
    '7p': { type: Boolean, default: false },
    '8p': { type: Boolean, default: false },
    '9p': { type: Boolean, default: false },
    '10p': { type: Boolean, default: false },
    '11p': { type: Boolean, default: false }
  },
  { _id: false }
)

const availabilitySchema = new mongoose.Schema(
  {
    Sunday: { type: availabilityDaySchema, default: availabilityDaySchema },
    Monday: { type: availabilityDaySchema, default: availabilityDaySchema },
    Tuesday: { type: availabilityDaySchema, default: availabilityDaySchema },
    Wednesday: { type: availabilityDaySchema, default: availabilityDaySchema },
    Thursday: { type: availabilityDaySchema, default: availabilityDaySchema },
    Friday: { type: availabilityDaySchema, default: availabilityDaySchema },
    Saturday: { type: availabilityDaySchema, default: availabilityDaySchema }
  },
  { _id: false }
)

var userSchema = new mongoose.Schema(
  {
    createdAt: { type: Date, default: Date.now },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      validate: {
        validator: function(v) {
          return validator.isEmail(v)
        },
        message: '{VALUE} is not a valid email'
      }
    },
    password: {
      type: String,
      select: false
    },
    verified: {
      type: Boolean,
      default: false
    },
    verificationToken: {
      type: String,
      select: false
    },
    passwordResetToken: {
      type: String,
      select: false
    },
    firstname: {
      type: String,
      required: [true, 'First name is required.']
    },
    lastname: {
      type: String,
      required: [true, 'Last name is required.']
    },

    // User type (volunteer or student)
    isVolunteer: {
      type: Boolean,
      default: false
    },

    isAdmin: {
      type: Boolean,
      default: false
    },

    /**
     * Test users are used to make help requests on production without bothering actual volunteers.
     * A student test user making a help request will only notify volunteer test users.
     */
    isTestUser: {
      type: Boolean,
      default: false
    },

    /*
     * Fake Users are real, fully functional accounts that we decide not to track because they've been
     * identified as accounts that aren't actual students/volunteers; just people trying out the service.
     */
    isFakeUser: {
      type: Boolean,
      default: false
    },

    pastSessions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Session' }],

    partnerUserId: {
      type: String,
      select: false
    },

    lastActivityAt: { type: Date, default: Date.now },

    /**
     * BEGIN STUDENT ATTRS
     */
    heardFrom: String,
    referred: String,
    approvedHighschool: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School'
      /* TODO validate approvedHighschool.isApproved: true
       * if this.isVolunteer is false */
    },
    zipCode: String,
    studentPartnerOrg: String,
    /**
     * END STUDENT ATTRS
     */

    /**
     * BEGIN VOLUNTEER ATTRS
     */
    registrationCode: { type: String, select: false },
    volunteerPartnerOrg: String,
    isFailsafeVolunteer: {
      type: Boolean,
      default: false,
      validate: {
        validator: function(v) {
          return this.isVolunteer || !v
        },
        message: 'A student cannot be a failsafe volunteer'
      }
    },
    phone: {
      type: String,
      required: [
        function() {
          return this.isVolunteer
        },
        'Phone number is required.'
      ]
      // @todo: server-side validation of international phone format
    },
    favoriteAcademicSubject: String,
    college: String,

    availability: {
      type: availabilitySchema,
      default: availabilitySchema
    },
    timezone: String,
    availabilityLastModifiedAt: { type: Date },
    elapsedAvailability: { type: Number, default: 0 },

    certifications: {
      prealgebra: {
        passed: {
          type: Boolean,
          default: false
        },
        tries: {
          type: Number,
          default: 0
        },
        lastAttemptedAt: { type: Date }
      },
      algebra: {
        passed: {
          type: Boolean,
          default: false
        },
        tries: {
          type: Number,
          default: 0
        },
        lastAttemptedAt: { type: Date }
      },
      geometry: {
        passed: {
          type: Boolean,
          default: false
        },
        tries: {
          type: Number,
          default: 0
        },
        lastAttemptedAt: { type: Date }
      },
      trigonometry: {
        passed: {
          type: Boolean,
          default: false
        },
        tries: {
          type: Number,
          default: 0
        },
        lastAttemptedAt: { type: Date }
      },
      precalculus: {
        passed: {
          type: Boolean,
          default: false
        },
        tries: {
          type: Number,
          default: 0
        },
        lastAttemptedAt: { type: Date }
      },
      calculus: {
        passed: {
          type: Boolean,
          default: false
        },
        tries: {
          type: Number,
          default: 0
        },
        lastAttemptedAt: { type: Date }
      },
      applications: {
        passed: {
          type: Boolean,
          default: false
        },
        tries: {
          type: Number,
          default: 0
        },
        lastAttemptedAt: { type: Date }
      },
      essays: {
        passed: {
          type: Boolean,
          default: false
        },
        tries: {
          type: Number,
          default: 0
        },
        lastAttemptedAt: { type: Date }
      },
      planning: {
        passed: {
          type: Boolean,
          default: false
        },
        tries: {
          type: Number,
          default: 0
        },
        lastAttemptedAt: { type: Date }
      }
    }
    /**
     * END VOLUNTEER ATTRS
     */
  },
  {
    toJSON: {
      virtuals: true
    },

    toObject: {
      virtuals: true
    }
  }
)

// Given a user record, strip out sensitive data for public consumption
userSchema.methods.parseProfile = function() {
  return {
    _id: this._id,
    email: this.email,
    verified: this.verified,
    firstname: this.firstname,
    lastname: this.lastname,
    isVolunteer: this.isVolunteer,
    isAdmin: this.isAdmin,
    isOnboarded: this.isOnboarded,
    isTestUser: this.isTestUser,
    referred: this.referred,
    createdAt: this.createdAt,
    phone: this.phone,
    availability: this.availability,
    availabilityLastModifiedAt: this.availabilityLastModifiedAt,
    timezone: this.timezone,
    highschoolName: this.highschoolName,
    college: this.college,
    favoriteAcademicSubject: this.favoriteAcademicSubject,
    heardFrom: this.heardFrom,
    isFakeUser: this.isFakeUser,
    certifications: this.certifications,
    phonePretty: this.phonePretty,
    numPastSessions: this.numPastSessions,
    numVolunteerSessionHours: this.numVolunteerSessionHours,
    mathCoachingOnly: this.mathCoachingOnly
  }
}

// Placeholder method to support asynchronous profile parsing
userSchema.methods.getProfile = function(cb) {
  cb(null, this.parseProfile())
}

userSchema.methods.hashPassword = function(password, cb) {
  bcrypt.genSalt(config.saltRounds, function(err, salt) {
    if (err) {
      cb(err)
    } else {
      bcrypt.hash(password, salt, cb)
    }
  })
}

userSchema.methods.verifyPassword = function(candidatePassword, cb) {
  var user = this

  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err) {
      return cb(err)
    } else if (isMatch) {
      return cb(null, user)
    } else {
      cb(null, false)
    }
  })
}

// Populates user document with the fields from the School document
// necessary to retrieve the high school name
userSchema.methods.populateForHighschoolName = function(cb) {
  return this.populate('approvedHighschool', 'nameStored SCH_NAME', cb)
}

// Populates user document with the fields from pastSessions documents
// necessary to retrieve numVolunteerSessionHours
userSchema.methods.populateForVolunteerStats = function(cb) {
  return this.populate(
    'pastSessions',
    'createdAt volunteerJoinedAt endedAt',
    cb
  )
}

// Calculates the amount of hours between this.availabilityLastModifiedAt
// and the current time that a user updates to a new availability
userSchema.methods.calculateElapsedAvailability = function(newModifiedDate) {
  // A volunteer must be onboarded before calculating their elapsed availability
  if (!this.isOnboarded) {
    return 0
  }

  const availabilityLastModifiedAt = moment(
    this.availabilityLastModifiedAt || this.createdAt
  )
    .tz('America/New_York')
    .format()
  const estTimeNewModifiedDate = moment(newModifiedDate)
    .tz('America/New_York')
    .format()

  // Convert availability to an object formatted with the day of the week
  // as the property and the amount of hours they have available for that day as the value
  // e.g { Monday: 10, Tuesday: 3 }
  const totalAvailabilityHoursMapped = countAvailabilityHours(
    this.availability.toObject()
  )

  // Count the occurrence of days of the week between a start and end date
  const frequencyOfDaysList = getFrequencyOfDays(
    removeTimeFromDate(availabilityLastModifiedAt),
    removeTimeFromDate(estTimeNewModifiedDate)
  )

  let totalHours = calculateTotalHours(
    totalAvailabilityHoursMapped,
    frequencyOfDaysList
  )

  // Deduct the amount hours that fall outside of the start and end date time
  const outOfRangeHours = countOutOfRangeHours(
    availabilityLastModifiedAt,
    estTimeNewModifiedDate,
    this.availability.toObject()
  )
  totalHours -= outOfRangeHours

  return totalHours
}

// regular expression that accepts multiple valid U. S. phone number formats
// see http://regexlib.com/REDetails.aspx?regexp_id=58
// modified to ignore trailing/leading whitespace and disallow alphanumeric characters
const PHONE_REGEX = /^\s*(?:[0-9](?: |-)?)?(?:\(?([0-9]{3})\)?|[0-9]{3})(?: |-)?(?:([0-9]{3})(?: |-)?([0-9]{4}))\s*$/

// virtual type for phone number formatted for readability
userSchema
  .virtual('phonePretty')
  .get(function() {
    if (!this.phone) {
      return null
    }

    // @todo: support better formatting of international numbers in phonePretty
    if (this.phone[0] === '+') {
      return this.phone
    }

    // first test user's phone number to see if it's a valid U.S. phone number
    var matches = this.phone.match(PHONE_REGEX)
    if (!matches) {
      return null
    }

    // ignore first element of matches, which is the full regex match,
    // and destructure remaining portion
    var [, area, prefix, line] = matches
    // accepted phone number format in database
    var reStrict = /^([0-9]{3})([0-9]{3})([0-9]{4})$/
    if (!this.phone.match(reStrict)) {
      // autocorrect phone number format
      var oldPhone = this.phone
      this.phone = `${area}${prefix}${line}`
      this.save(function(err, user) {
        if (err) {
          console.log(err)
        } else {
          console.log(`Phone number ${oldPhone} corrected to ${user.phone}.`)
        }
      })
    }
    return `${area}-${prefix}-${line}`
  })
  .set(function(v) {
    if (!v) {
      this.phone = v
    } else {
      // @todo: support better setting of international numbers in phonePretty
      if (v[0] === '+') {
        this.phone = `+${v.replace(/\D/g, '')}`
        return
      }

      // ignore first element of match result, which is the full match,
      // and destructure the remaining portion
      var [, area, prefix, line] = v.match(PHONE_REGEX) || []
      this.phone = `${area}${prefix}${line}`
    }
  })

userSchema.virtual('highschoolName').get(function() {
  if (this.approvedHighschool) {
    return this.approvedHighschool.name
  } else {
    return null
  }
})

userSchema.virtual('volunteerPointRank').get(function() {
  if (!this.isVolunteer) return null
  return tallyVolunteerPoints(this)
})

// Virtual that gets all notifications that this user has been sent
userSchema.virtual('notifications', {
  ref: 'Notification',
  localField: '_id',
  foreignField: 'volunteer',
  options: { sort: { sentAt: -1 } }
})

userSchema.virtual('volunteerLastSession', {
  ref: 'Session',
  localField: '_id',
  foreignField: 'volunteer',
  justOne: true,
  options: { sort: { createdAt: -1 } }
})

userSchema.virtual('volunteerLastNotification', {
  ref: 'Notification',
  localField: '_id',
  foreignField: 'volunteer',
  justOne: true,
  options: { sort: { sentAt: -1 } }
})

userSchema.virtual('numPastSessions').get(function() {
  if (!this.pastSessions) {
    return 0
  }

  return this.pastSessions.length
})

userSchema.virtual('numVolunteerSessionHours').get(function() {
  if (!this.pastSessions || !this.pastSessions.length) {
    return 0
  }

  // can't calculate when pastSessions hasn't been .populated()
  if (!this.pastSessions[0].createdAt) {
    return null
  }

  const totalMilliseconds = this.pastSessions.reduce((totalMs, pastSession) => {
    // early skip if session is missing necessary props
    if (!(pastSession.volunteerJoinedAt && pastSession.endedAt)) {
      return totalMs
    }

    const volunteerJoinDate = new Date(pastSession.volunteerJoinedAt)
    const sessionEndDate = new Date(pastSession.endedAt)
    let millisecondDiff = sessionEndDate - volunteerJoinDate

    // if session was longer than 5 hours, it was probably an old glitch
    if (millisecondDiff > 18000000) {
      return totalMs
    }

    // skip if for some reason the volunteer joined after the session ended
    if (millisecondDiff < 0) {
      return totalMs
    }

    return millisecondDiff + totalMs
  }, 0)

  // milliseconds in hour = (60,000 * 60) = 3,600,000
  const hoursDiff = (totalMilliseconds / 3600000).toFixed(2)

  return hoursDiff
})

userSchema.virtual('mathCoachingOnly').get(function() {
  if (!this.isVolunteer) return null
  if (!this.volunteerPartnerOrg) return false

  const volunteerPartnerManifest =
    config.volunteerPartnerManifests[this.volunteerPartnerOrg]

  return (
    !!volunteerPartnerManifest && !!volunteerPartnerManifest['mathCoachingOnly']
  )
})

userSchema.virtual('isOnboarded').get(function() {
  if (!this.isVolunteer) return null

  let isCertified = false

  for (let index in this.certifications) {
    if (this.certifications[index].passed) {
      isCertified = true
      break
    }
  }

  return this.availabilityLastModifiedAt && isCertified
})

// Static method to determine if a registration code is valid
userSchema.statics.checkCode = function(code) {
  const volunteerCodes = config.VOLUNTEER_CODES.split(',')

  const isVolunteerCode = volunteerCodes.some(volunteerCode => {
    return volunteerCode.toUpperCase() === code.toUpperCase()
  })

  return isVolunteerCode
}

module.exports = mongoose.model('User', userSchema)
