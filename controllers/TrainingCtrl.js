const _ = require('lodash')

const Question = require('../models/Question')
const User = require('../models/User')

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
  biology: 1
}
const PASS_THRESHOLD = 0.8

module.exports = {
  getQuestions: async function(options) {
    const subcategories = Question.getSubcategories(options.category)

    if (!subcategories) {
      throw new Error(
        'No subcategories defined for category: ' + options.category
      )
    }

    const questions = await Question.find({
      category: options.category
    })

    const questionsBySubcategory = _.groupBy(
      questions,
      question => question.subcategory
    )

    return _.shuffle(
      Object.entries(questionsBySubcategory).flatMap(([, subQuestions]) =>
        _.sampleSize(subQuestions, numQuestions[options.category])
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

    await User.updateOne({ _id: user._id }, userUpdates)

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
