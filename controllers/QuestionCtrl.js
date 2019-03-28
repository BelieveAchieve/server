const Question = require('../models/Question')

const list = (options, cb) => {
  return new Promise((resolve, reject) => {
    Question.find({}, (err, question) => {
      if (err || !question) {
        reject(new Error('could not get questions'))
      } else {
        resolve(question)
      }
    })
  })
}

const get = (options, cb) => {
  const { questionId } = options

  Question.findById(questionId, (err, question) => {
    if (err || !question) {
      cb(new Error('could not get question'))
    } else {
      cb(question)
    }
  })
}

const update = (options, cb) => {
  const { questionId, question } = options

  Question.update({ _id: questionId }, question, (err, question) => {
    if (err || !question) {
      cb(new Error('could not update question'))
    } else {
      cb(question)
    }
  })
}

module.exports = {
  list: list,
  get: get,
  update: update
}
