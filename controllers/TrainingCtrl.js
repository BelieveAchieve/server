var Question = require('../models/Question')
var User = require('../models/User')

// change depending on how many of each subcategory are wanted
var numQuestions = {
  algebra: 2,
  geometry: 2,
  trigonometry: 2,
  precalculus: 2,
  calculus: 3,
  esl: 3,
  planning: 4,
  essays: 3,
  applications: 2,
  biology: 1,
  chemistry: 2
}
const PASS_THRESHOLD = 0.8

// Fisher-Yates shuffle
function shuffle (origArray) {
  var array = origArray.slice(0) // clones the array
  var currIndex = array.length

  var tempValue

  var randomIndex

  // while there are still elements to shuffle
  while (currIndex !== 0) {
    // pick a remaining element
    randomIndex = Math.floor(Math.random() * currIndex)
    currIndex -= 1

    // swap it with the current element
    tempValue = array[currIndex]
    array[currIndex] = array[randomIndex]
    array[randomIndex] = tempValue
  }

  return array
}

module.exports = {
  getQuestions: function (options, callback) {
    var subcategories = Question.getSubcategories(options.category)

    Question.find({ category: options.category }, function (err, questions) {
      if (err) {
        return callback(err)
      } else if (!subcategories) {
        return callback(new Error('No subcategories defined for category: ' + options.category))
      } else {
        var randomQuestions = []
        var questionsBySubcategory = questions.reduce(function (acc, question) {
          var subcategory = question.subcategory
          if (acc[subcategory] == null) {
            // If null, subcategory has not been initialized, so create an array with the question in it:
            acc[subcategory] = [question]
            return acc
          } else {
            // Since the key is not null, we can assume we have previously populated it with an array holding a question
            acc[subcategory].push(question)
            return acc
          }
        }, {})

        // get x unique, random objects from n objects in arrays
        subcategories.map(function (subcategory) {
          var questions = questionsBySubcategory[subcategory] || []
          questions = shuffle(questions)
          var minQuestions = Math.min(
            questions.length,
            numQuestions[options.category]
          )
          randomQuestions = randomQuestions.concat(
            questions.slice(0, minQuestions)
          )
        })

        randomQuestions = shuffle(randomQuestions)
        return callback(null, randomQuestions)
      }
    })
  },

  getQuizScore: function (options, callback) {
    var userid = options.userid
    var idAnswerMap = options.idAnswerMap
    var category = options.category
    var score = 0
    var objIDs = Object.keys(idAnswerMap)
    var idCorrectAnswerMap = {}
    Question.find({ _id: { $in: objIDs } }, function (err, questions) {
      if (err) {
        return callback(err)
      } else {
        questions.forEach(function (question) {
          var correctAnswer = question.correctAnswer
          idCorrectAnswerMap[question._id] = question.correctAnswer
          var userAnswer = idAnswerMap[question._id]
          if (correctAnswer === userAnswer) {
            score = score + 1
          }
        })
        var percent = score / questions.length
        var hasPassed = false
        if (percent >= PASS_THRESHOLD) {
          hasPassed = true
        }
        User.findOne({ _id: userid }, function (err, user) {
          if (err) {
            return callback(err)
          }
          if (!user) {
            return callback(new Error('No account with that id found.'))
          }
          user.certifications[category]['passed'] = hasPassed
          var tries = user.certifications[category]['tries']
          if (tries) {
            tries++
          } else {
            tries = 1
          }
          user.certifications[category]['tries'] = tries
          user.save(function (err, user) {
            if (err) {
              callback(err, null)
            } else {
              callback(null, {
                tries: tries,
                passed: hasPassed,
                score: score,
                idCorrectAnswerMap: idCorrectAnswerMap
              })
            }
          })
        })
      }
    })
  }
}
