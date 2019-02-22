var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var validator = require('validator');

var config = require('../config.js');

var userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    lowercase: true,
    validate: {
      validator: function(v){
        return validator.isEmail(v);
      },
      message: '{VALUE} is not a valid email'
    }
  },
  password: String,

  verified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  registrationCode: String,
  passwordResetToken: String,

  // Profile data
  firstname: String,
  lastname: String,
  nickname: String,
  serviceInterests: [String],
  picture: String,
  birthdate: String,
  gender: String,
  race: [String],
  groupIdentification: [String],
  computerAccess: [String],
  preferredTimes: [String],
  phone: String,
  highschool: String,
  currentGrade: String,
  expectedGraduation: String,
  difficultAcademicSubject: String,
  difficultCollegeProcess: [String],
  highestLevelEducation: [String],
  hasGuidanceCounselor: String,
  favoriteAcademicSubject: String,
  gpa: String,
  collegeApplicationsText: String,
  commonCollegeDocs: [String],
  college: String,
  academicInterestsText: String,
  testScoresText: String,
  advancedCoursesText: String,
  extracurricularActivitesText: String,
  heardFrom: String,
  referred: String,
  preferredContactMethod: [String],
  availability: {
    Sunday: { '12a': Boolean, '1a': Boolean, '2a': Boolean, '3a': Boolean, '4a': Boolean,
      '5a': Boolean, '6a': Boolean, '7a': Boolean, '8a': Boolean, '9a': Boolean,
      '10a': Boolean, '11a': Boolean, '12p': Boolean, '1p': Boolean, '2p': Boolean,
      '3p': Boolean, '4p': Boolean, '5p': Boolean, '6p': Boolean, '7p': Boolean,
      '8p': Boolean, '9p': Boolean, '10p': Boolean, '11p': Boolean},
    Monday: { '12a': Boolean, '1a': Boolean, '2a': Boolean, '3a': Boolean, '4a': Boolean,
      '5a': Boolean, '6a': Boolean, '7a': Boolean, '8a': Boolean, '9a': Boolean,
      '10a': Boolean, '11a': Boolean, '12p': Boolean, '1p': Boolean, '2p': Boolean,
      '3p': Boolean, '4p': Boolean, '5p': Boolean, '6p': Boolean, '7p': Boolean,
      '8p': Boolean, '9p': Boolean, '10p': Boolean, '11p': Boolean},
    Tuesday: { '12a': Boolean, '1a': Boolean, '2a': Boolean, '3a': Boolean, '4a': Boolean,
      '5a': Boolean, '6a': Boolean, '7a': Boolean, '8a': Boolean, '9a': Boolean,
      '10a': Boolean, '11a': Boolean, '12p': Boolean, '1p': Boolean, '2p': Boolean,
      '3p': Boolean, '4p': Boolean, '5p': Boolean, '6p': Boolean, '7p': Boolean,
      '8p': Boolean, '9p': Boolean, '10p': Boolean, '11p': Boolean},
    Wednesday: { '12a': Boolean, '1a': Boolean, '2a': Boolean, '3a': Boolean, '4a': Boolean,
      '5a': Boolean, '6a': Boolean, '7a': Boolean, '8a': Boolean, '9a': Boolean,
      '10a': Boolean, '11a': Boolean, '12p': Boolean, '1p': Boolean, '2p': Boolean,
      '3p': Boolean, '4p': Boolean, '5p': Boolean, '6p': Boolean, '7p': Boolean,
      '8p': Boolean, '9p': Boolean, '10p': Boolean, '11p': Boolean},
    Thursday: { '12a': Boolean, '1a': Boolean, '2a': Boolean, '3a': Boolean, '4a': Boolean,
      '5a': Boolean, '6a': Boolean, '7a': Boolean, '8a': Boolean, '9a': Boolean,
      '10a': Boolean, '11a': Boolean, '12p': Boolean, '1p': Boolean, '2p': Boolean,
      '3p': Boolean, '4p': Boolean, '5p': Boolean, '6p': Boolean, '7p': Boolean,
      '8p': Boolean, '9p': Boolean, '10p': Boolean, '11p': Boolean},
    Friday: { '12a': Boolean, '1a': Boolean, '2a': Boolean, '3a': Boolean, '4a': Boolean,
      '5a': Boolean, '6a': Boolean, '7a': Boolean, '8a': Boolean, '9a': Boolean,
      '10a': Boolean, '11a': Boolean, '12p': Boolean, '1p': Boolean, '2p': Boolean,
      '3p': Boolean, '4p': Boolean, '5p': Boolean, '6p': Boolean, '7p': Boolean,
      '8p': Boolean, '9p': Boolean, '10p': Boolean, '11p': Boolean},
    Saturday: { '12a': Boolean, '1a': Boolean, '2a': Boolean, '3a': Boolean, '4a': Boolean,
      '5a': Boolean, '6a': Boolean, '7a': Boolean, '8a': Boolean, '9a': Boolean,
      '10a': Boolean, '11a': Boolean, '12p': Boolean, '1p': Boolean, '2p': Boolean,
      '3p': Boolean, '4p': Boolean, '5p': Boolean, '6p': Boolean, '7p': Boolean,
      '8p': Boolean, '9p': Boolean, '10p': Boolean, '11p': Boolean}
  },
  hasSchedule: false,
  timezone: String,

  algebra: {
    passed: {
      type: Boolean,
      default: false
    },
    tries: {
      type: Number,
      default: 0
    }
  },
  applications: {
   passed: {
    type: Boolean,
    default: false
   },
   tries: {
    type: Number,
    default: 0
   }
 },
biology: {
   passed: {
    type: Boolean,
    default: false
   },
   tries: {
    type: Number,
    default: 0
   }
 },
chemistry: {
   passed: {
    type: Boolean,
    default: false
   },
   tries: {
    type: Number,
    default: 0
   }
 },

  essays: {
   passed: {
    type: Boolean,
    default: false
   },
   tries: {
    type: Number,
    default: 0
   }
 },

geometry: {
    passed: {
      type: Boolean,
      default: false
    },
    tries: {
      type: Number,
      default: 0
    }
  },

planning: {
   passed: {
    type: Boolean,
    default: false
   },
   tries: {
    type: Number,
    default: 0
   }
 },
 trigonometry: {
    passed: {
      type: Boolean,
      default: false
    },
    tries: {
      type: Number,
      default: 0
    }
  },

  esl: {
    passed: {
      type: Boolean,
      default: false
    },
    tries: {
      type: Number,
      default: 0
    }
  },

  precalculus: {
    passed: {
      type: Boolean,
      default: false
    },
    tries: {
      type: Number,
      default: 0
    }
  },

  calculus: {
    passed: {
      type: Boolean,
      default: false
    },
    tries: {
      type: Number,
      default: 0
    }
  },

  // User status
  isVolunteer: {
    type: Boolean,
    default: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isTestUser: {
    type: Boolean,
    default: false
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

// Given a user record, strip out sensitive data for public consumption
userSchema.methods.parseProfile = function(){
  return {
    _id: this._id,
    email: this.email,
    verified: this.verified,
    firstname: this.firstname,
    lastname: this.lastname,
    nickname: this.nickname,
    picture: this.picture,
    isVolunteer: this.isVolunteer,
    isAdmin: this.isAdmin,
    referred: this.referred,
    createdAt: this.createdAt,

    birthdate: this.birthdate,
    serviceInterests: this.serviceInterests,
    gender: this.gender,
    race: this.race,
    groupIdentification: this.groupIdentification,
    computerAccess: this.computerAccess,
    preferredTimes: this.preferredTimes,
    phone: this.phone,
    preferredContactMethod: this.preferredContactMethod,
    availability: this.availability,
    hasSchedule: this.hasSchedule,

    highschool: this.highschool,
    currentGrade: this.currentGrade,
    expectedGraduation: this.expectedGraduation,
    difficultAcademicSubject: this.difficultAcademicSubject,
    difficultCollegeProcess: this.difficultCollegeProcess,
    highestLevelEducation: this.highestLevelEducation,
    hasGuidanceCounselor: this.hasGuidanceCounselor,
    gpa: this.gpa,
    college: this.college,
    collegeApplicationsText: this.collegeApplicationsText,
    commonCollegeDocs: this.commonCollegeDocs,
    academicInterestsText: this.academicInterestsText,
    testScoresText: this.testScoresText,
    advancedCoursesText: this.advancedCoursesText,
    extracurricularActivitesText: this.extracurricularActivitesText,
    favoriteAcademicSubject: this.favoriteAcademicSubject,
    heardFrom: this.heardFrom,

    algebra: this.algebra,
    geometry: this.geometry,
    trigonometry: this.trigonometry,
    esl: this.esl,
    precalculus: this.precalculus,
    calculus: this.calculus
  };
};

// Placeholder method to support asynchronous profile parsing
userSchema.methods.getProfile = function(cb){
  cb(null, this.parseProfile());
};

userSchema.methods.hashPassword = function(password, cb){
  bcrypt.genSalt(config.saltRounds, function(err, salt){
    if (err){
      cb(err);
    } else {
      bcrypt.hash(password, salt, cb);
    }
  });
};

userSchema.methods.verifyPassword = function(candidatePassword, cb){
  var user = this;

  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err){
      return cb(err);
    } else if (isMatch){
      return cb(null, user);
    } else {
      cb(null, false);
    }
  });
};

// Static method to determine if a registration code is valid
userSchema.statics.checkCode = function(code, cb){
  var studentCodes = [
    'STUDENTTESTING18', 'OASIS18' , 'ONLINEAPP'
  ];

  var volunteerCodes = [
    'COACH18','VOLUNTEERTESTING18'
  ];

  var isStudentCode = studentCodes.some(function(studentCode){
    return studentCode.toUpperCase() === code.toUpperCase();
  });
  var isVolunteerCode = volunteerCodes.some(function(volunteerCode){
    return volunteerCode.toUpperCase() === code.toUpperCase();
  });

  if (isStudentCode || isVolunteerCode){
    cb(null, {
      studentCode: isStudentCode,
      volunteerCode: isVolunteerCode
    });
  } else {
    cb('Registration code is invalid', false);
  }
}

module.exports = mongoose.model('User', userSchema);
