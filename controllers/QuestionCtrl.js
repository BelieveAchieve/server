const Question = require('../models/Question')

const list = async (options, cb) => {
  return Question.find({})
}

const update = async options => {
  const { id, question } = options

  return Question.findOneAndUpdate(
    { _id: id },
    { $set: question },
    { new: true, upsert: true }
  )
}

module.exports = {
  list: list,
  update: update
}
