const _ = require('lodash')
const UserActionCtrl = require('../controllers/UserActionCtrl')
const Question = require('../models/Question')
const Volunteer = require('../models/Volunteer')
const {
  CERT_UNLOCKING,
  COMPUTED_CERTS,
  SUBJECTS,
  REQUIRED_TRAINING
} = require('../constants')
const getSupercategory = require('../utils/getSupercategory')

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
      const unlockedCerts = this.getUnlockedCerts(category, user.certifications)
      for (const category of unlockedCerts) {
        if (CERT_UNLOCKING[category])
          userUpdates[`certifications.${category}.passed`] = true
      }
      // @todo: Send off user action for the new subjects (ignore duplicates)
      // @todo: Issue with existing volunteers and onboarding / required training
      userUpdates.$addToSet = { subjects: unlockedCerts }
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
  getUnlockedCerts: function(category, certifications) {
    // Check if the user has completed required training for this category
    if (!this.completedRequiredTraining(category, certifications)) return []

    // Add all the categories that this category unlocks into a Set
    const currentCerts = new Set(CERT_UNLOCKING[category])

    // Set passed on the category if the current category is required training
    if (this.isRequiredTrainingCategory(category))
      Object.assign(certifications, { [category]: { passed: true } })

    for (const cert in certifications) {
      // Check that the required training was completed for every certification that a user has
      // Add all the other subjects that a certification unlocks to the Set
      if (
        certifications[cert].passed &&
        this.completedRequiredTraining(cert, certifications) &&
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

    return Array.from(currentCerts)
  },

  completedRequiredTraining: function(category, certifications) {
    // Early exit if the category itself is a required training category
    if (this.isRequiredTrainingCategory(category)) return true

    const supercategory = getSupercategory(category).toLowerCase()

    if (
      (supercategory === 'math' || supercategory === 'science') &&
      certifications.tutoringSkills.passed
    )
      return true

    if (supercategory === 'college' && certifications.collegeCounseling.passed)
      return true

    // @todo: check if standardized testing has a training that needs to be required
    if (supercategory === 'standardized testing') return true

    return false
  },

  isRequiredTrainingCategory: function(category) {
    if (
      category === REQUIRED_TRAINING.TUTORING_SKILLS ||
      category === REQUIRED_TRAINING.COLLEGE_COUNSELING
    )
      return true
    else return false
  }
}
