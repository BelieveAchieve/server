const _ = require('lodash')
const UserActionCtrl = require('../controllers/UserActionCtrl')
const Question = require('../models/Question')
const Volunteer = require('../models/Volunteer')
const {
  CERT_UNLOCKING,
  COMPUTED_CERTS,
  TRAINING,
  MATH_CERTS,
  SCIENCE_CERTS,
  SAT_CERTS,
  SUBJECT_TYPES
} = require('../constants')
const getSubjectType = require('../utils/getSubjectType')

// change depending on how many of each subcategory are wanted
const numQuestions = {
  prealgebra: 2,
  algebra: 2,
  geometry: 2,
  trigonometry: 2,
  precalculus: 2,
  calculus: 3,
  planning: 4,
  essays: 3,
  applications: 2,
  biology: 1,
  chemistry: 1,
  physicsOne: 1
}
const PASS_THRESHOLD = 0.8

// Check if a user is certified in a given group of subject certs
const isCertifiedIn = (subjectCerts, certifications) => {
  for (let cert in subjectCerts) {
    const subject = subjectCerts[cert]
    if (certifications[subject].passed) return true
  }

  return false
}

module.exports = {
  getQuestions: async function(options) {
    const { category } = options
    const subcategories = Question.getSubcategories(category)

    if (!subcategories) {
      throw new Error('No subcategories defined for category: ' + category)
    }

    const questions = await Question.find({
      category
    })

    const questionsBySubcategory = _.groupBy(
      questions,
      question => question.subcategory
    )

    return _.shuffle(
      Object.entries(questionsBySubcategory).flatMap(([, subQuestions]) =>
        _.sampleSize(subQuestions, numQuestions[category])
      )
    )
  },

  getQuizScore: async function({ user, idAnswerMap, category: cert, ip }) {
    const objIDs = Object.keys(idAnswerMap)
    const questions = await Question.find({ _id: { $in: objIDs } }).exec()

    const score = questions.filter(
      question => question.correctAnswer === idAnswerMap[question._id]
    ).length

    const percent = score / questions.length
    const passed = percent >= PASS_THRESHOLD

    const tries = user.certifications[cert]['tries'] + 1

    const userUpdates = {
      [`certifications.${cert}.passed`]: passed,
      [`certifications.${cert}.tries`]: tries,
      [`certifications.${cert}.lastAttemptedAt`]: new Date()
    }

    if (passed) {
      const unlockedSubjects = this.getUnlockedSubjects(
        cert,
        user.certifications
      )

      // Create a user action for every subject unlocked
      for (const subject of unlockedSubjects) {
        // @note: user.certifications is modified in this.getUnlockedSubjects
        const hasPassedQuizUserAction =
          user.certifications[subject] && user.certifications[subject].passed
        if (!user.subjects.includes(subject) && !hasPassedQuizUserAction)
          UserActionCtrl.unlockedSubject(user._id, subject, ip)
      }

      userUpdates.$addToSet = { subjects: unlockedSubjects }

      if (
        !user.isOnboarded &&
        user.availabilityLastModifiedAt &&
        unlockedSubjects.length > 0
      ) {
        userUpdates.isOnboarded = true
        UserActionCtrl.accountOnboarded(user._id, ip)
      }
    }

    await Volunteer.updateOne({ _id: user._id }, userUpdates, {
      runValidators: true
    })

    const idCorrectAnswerMap = questions.reduce((correctAnswers, question) => {
      correctAnswers[question._id] = question.correctAnswer
      return correctAnswers
    }, {})

    return {
      tries,
      passed,
      score,
      idCorrectAnswerMap
    }
  },

  getUnlockedSubjects: function(cert, userCertifications) {
    // update certifications to have the current cert completed set to passed
    Object.assign(userCertifications, { [cert]: { passed: true } })

    // UPchieve 101 must be completed before a volunteer can be onboarded
    if (!userCertifications[TRAINING.UPCHIEVE_101].passed) return []

    const certType = getSubjectType(cert)

    // Check if the user has a certification for the required training
    if (
      certType === SUBJECT_TYPES.TRAINING &&
      !this.hasCertForRequiredTraining(cert, userCertifications)
    )
      return []

    // Check if the user has completed required training for this cert
    if (
      certType !== SUBJECT_TYPES.TRAINING &&
      !this.hasRequiredTraining(cert, userCertifications)
    )
      return []

    // Add all the certifications that this completed cert unlocks into a Set
    const currentCerts = new Set(CERT_UNLOCKING[cert])

    for (const cert in userCertifications) {
      // Check that the required training was completed for every certification that a user has
      // Add all the other subjects that a certification unlocks to the Set
      if (
        userCertifications[cert].passed &&
        this.hasRequiredTraining(cert, userCertifications) &&
        CERT_UNLOCKING[cert]
      )
        CERT_UNLOCKING[cert].forEach(subject => currentCerts.add(subject))
    }

    // Check if the user has unlocked a new certification based on the current certifications they have
    for (const cert in COMPUTED_CERTS) {
      const prerequisiteCerts = COMPUTED_CERTS[cert]
      let meetsRequirements = true

      for (let i = 0; i < prerequisiteCerts.length; i++) {
        // SAT Math can be unlocked from taking Geometry, Trigonometry, and Algebra or
        // from Calculus AB, Calculus BC, and Precalculus - none of which unlock Geometry
        if (
          cert === SAT_CERTS.SAT_MATH &&
          (currentCerts.has(MATH_CERTS.CALCULUS_AB) ||
            currentCerts.has(MATH_CERTS.CALCULUS_BC) ||
            currentCerts.has(MATH_CERTS.PRECALCULUS))
        )
          break

        if (!currentCerts.has(prerequisiteCerts[i])) {
          meetsRequirements = false
          break
        }
      }

      if (meetsRequirements) currentCerts.add(cert)
    }

    // SAT Math is a special case, it can be unlocked by multiple math certs, but must have SAT Strategies completed
    if (
      currentCerts.has(SAT_CERTS.SAT_MATH) &&
      !userCertifications[TRAINING.SAT_STRATEGIES].passed
    )
      currentCerts.delete(SAT_CERTS.SAT_MATH)

    return Array.from(currentCerts)
  },

  // Check if a given cert has the required training completed
  hasRequiredTraining: function(cert, userCertifications) {
    const certType = getSubjectType(cert).toLowerCase()

    if (
      (certType === SUBJECT_TYPES.MATH || certType === SUBJECT_TYPES.SCIENCE) &&
      userCertifications[TRAINING.TUTORING_SKILLS].passed
    )
      return true

    if (
      certType === SUBJECT_TYPES.COLLEGE &&
      userCertifications[TRAINING.COLLEGE_COUNSELING].passed
    )
      return true

    if (
      certType === SUBJECT_TYPES.SAT &&
      userCertifications[TRAINING.SAT_STRATEGIES].passed
    )
      return true

    return false
  },

  // Check if a required training cert has any associated passed certifications for it
  hasCertForRequiredTraining: function(cert, userCertifications) {
    // UPchieve 101 doesn't need any associated certs
    if (cert === TRAINING.UPCHIEVE_101) return true

    // College counseling unlocks Planning and Essays by default, meaning no requirements are needed to unlock the college related certifications besides completing the required training
    if (cert === TRAINING.COLLEGE_COUNSELING) return true

    if (
      cert === TRAINING.TUTORING_SKILLS &&
      isCertifiedIn({ ...MATH_CERTS, ...SCIENCE_CERTS }, userCertifications)
    )
      return true

    if (
      cert === TRAINING.SAT_STRATEGIES &&
      isCertifiedIn(SAT_CERTS, userCertifications)
    )
      return true

    return false
  }
}
