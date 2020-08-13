const _ = require('lodash')
const UserActionCtrl = require('../controllers/UserActionCtrl')
const Question = require('../models/Question')
const Volunteer = require('../models/Volunteer')
const { CERT_UNLOCKING, COMPUTED_CERTS, SUBJECTS } = require('../constants')

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

  getQuizScore: async function({ user, idAnswerMap, category, ip }) {
    const objIDs = Object.keys(idAnswerMap)
    const questions = await Question.find({ _id: { $in: objIDs } }).exec()

    const score = questions.filter(
      question => question.correctAnswer === idAnswerMap[question._id]
    ).length

    const percent = score / questions.length
    const passed = percent >= PASS_THRESHOLD

    const tries = user.certifications[category]['tries'] + 1

    const userUpdates = {
      [`certifications.${category}.passed`]: passed,
      [`certifications.${category}.tries`]: tries,
      [`certifications.${category}.lastAttemptedAt`]: new Date()
    }

    if (passed) {
      const unlockedCerts = this.getUnlockedCerts(user.certifications, category)
      for (const category of unlockedCerts) {
        userUpdates[`certifications.${category}.passed`] = true
      }

      // an onboarded volunteer must have updated their availability and obtained at least one certification
      if (!user.isOnboarded && user.availabilityLastModifiedAt) {
        userUpdates.isOnboarded = true
        UserActionCtrl.accountOnboarded(user._id, ip)
      }
    }

    await Volunteer.updateOne({ _id: user._id }, userUpdates)

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
  // Returns an array of certs that the user should be updated with
  getUnlockedCerts: function(certifications, category) {
    // Add all the categories that the user has passed into a Set
    const currentCerts = new Set(CERT_UNLOCKING[category])
    for (const category in certifications) {
      if (certifications[category].passed) currentCerts.add(category)
    }

    // Check if the user has unlocked a new certification based on the current certifications they have
    for (const cert in COMPUTED_CERTS) {
      const prerequisiteCerts = COMPUTED_CERTS[cert]
      let meetsRequirements = true

      for (let i = 0; i < prerequisiteCerts.length; i++) {
        // SAT Math can be unlocked from taking Geometry, Trigonometry, and Algebra or
        // from Calculus AB, Calculus BC, and Precalculus - none of which unlock Geometry
        if (
          cert === SUBJECTS.SAT_MATH &&
          (currentCerts.has(SUBJECTS.CALCULUS_AB) ||
            currentCerts.has(SUBJECTS.CALCULUS_BC) ||
            currentCerts.has(SUBJECTS.PRECALCULUS))
        )
          break

        if (!currentCerts.has(prerequisiteCerts[i])) {
          meetsRequirements = false
          break
        }
      }

      if (meetsRequirements) currentCerts.add(cert)
    }

    // Remove certs from the Set that the user is already certified in
    for (const category in certifications) {
      if (certifications[category].passed) currentCerts.delete(category)
    }

    return Array.from(currentCerts)
  }
}
