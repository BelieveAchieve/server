const _ = require('lodash')

const Question = require('../models/Question')
const Volunteer = require('../models/Volunteer')
const StatsService = require('../services/StatsService')

/**
 *
 * Build an update object to add Integrated Math Certifications
 * if requirements are met.
 *
 * Integrated Math Certification Requirements:
 * Integrated Math One    - Algebra and Geometry
 * Integrated Math Two    - Algebra, Geometry, and Trigonometry
 * Integrated Math Three  - Algebra, Geometry, and Precalculus
 * Integrated Math Four   - Algebra, Trigonometry, and Precalculus
 *
 */
const addIntegratedMathCert = (certifications, newlyPassedCategory) => {
  const passedCategories = new Set()
  const prerequisiteCategories = [
    'algebra',
    'geometry',
    'trigonometry',
    'precalculus'
  ]
  const update = {}

  // early exit if the category is not a prequisite for Integrated Math
  if (!prerequisiteCategories.includes(newlyPassedCategory)) return update

  for (const category in certifications) {
    if (certifications[category].passed) passedCategories.add(category)
  }
  passedCategories.add(newlyPassedCategory)

  if (passedCategories.has('algebra')) {
    if (
      passedCategories.has('geometry') &&
      !passedCategories.has('integratedMathOne')
    )
      update['certifications.integratedMathOne.passed'] = true

    if (
      passedCategories.has('geometry') &&
      passedCategories.has('trigonometry') &&
      !passedCategories.has('integratedMathTwo')
    )
      update['certifications.integratedMathTwo.passed'] = true

    if (
      passedCategories.has('geometry') &&
      passedCategories.has('precalculus') &&
      !passedCategories.has('integratedMathThree')
    )
      update['certifications.integratedMathThree.passed'] = true

    if (
      passedCategories.has('trigonometry') &&
      passedCategories.has('precalculus') &&
      !passedCategories.has('integratedMathFour')
    )
      update['certifications.integratedMathFour.passed'] = true
  }

  return update
}

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

  getQuizScore: async function({ user, idAnswerMap, category }) {
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
      const integratedMathUpdate = addIntegratedMathCert(
        user.certifications,
        category
      )
      Object.assign(userUpdates, integratedMathUpdate)

      // doesn't account for the integrate math certs
      StatsService.increment('certified-volunteers', { subject: category })

      // an onboarded volunteer must have updated their availability and obtained at least one certification
      if (!user.isOnboarded && user.availabilityLastModifiedAt) {
        StatsService.incrementOnboardedVolunteers(
          'onboarded-volunteers',
          user._id
        )
        userUpdates.isOnboarded = true
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
  }
}
