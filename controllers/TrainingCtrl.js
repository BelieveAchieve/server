var Question = require('../models/Question')
var User = require('../models/User')

// change depending on how many of each subcategory are wanted
var numQuestions = {
  algebra: 2,
  geometry: 2,
  trigonometry: 2,
  precalculus: 2,
  calculus: 3,
  planning: 4,
  essays: 3,
  applications: 2
}
const PASS_THRESHOLD = 0.8

module.exports = {
  getQuestions: async function (options) {
    const subcategories = Question.getSubcategories(options.category)
    
    if (!subcategories) {
      throw new Error('No subcategories defined for category: ' + options.category)
    }
    
    return (await Promise.all(
      subcategories.map(
        (subcategory) => Question.aggregate([
          { $match: { category: options.category, subcategory: subcategory } },
          { $sample: { size: numQuestions[options.category] } }
        ]).exec()
      )
    ))
      .flat()
  },

  getQuizScore: async function (options, callback) {
    const userid = options.userid
    const idAnswerMap = options.idAnswerMap
    const category = options.category
    const objIDs = Object.keys(idAnswerMap)
    
    const questions = await Question.find({ _id: { $in: objIDs } }).exec()
    
    const score = questions
      .filter((question) => question.correctAnswer === idAnswerMap[question._id])
      .length
    
    const idCorrectAnswerMap = questions.reduce(
      (acc, question) => {
        acc[question._id] = question.correctAnswer
        return acc
      }, {})
     
    const percent = score / questions.length
    
    const hasPassed = percent >= PASS_THRESHOLD
    
    const user = await User.findOne({ _id: userid })
    
    if (!user) {
      throw new Error('No account with that id found.')
    }
    
    user.certifications[category]['passed'] = hasPassed
    
    let tries = user.certifications[category]['tries']
    if (!tries) {
      tries = 0
    }
    tries++
    user.certifications[category]['tries'] = tries
    
    await user.save()
    
    return {
      tries: tries,
      passed: hasPassed,
      score: score,
      idCorrectAnswerMap: idCorrectAnswerMap
    }
  }
}
