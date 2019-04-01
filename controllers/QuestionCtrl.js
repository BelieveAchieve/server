const Question = require('../models/Question')

const list = async (filters, cb) => {
  return Question.find(filters)
}

const create = async attrs => {
  return Question.create(attrs)
}

const update = async options => {
  const { id, question } = options

  return Question.findOneAndUpdate(
    { _id: id },
    { $set: question },
    { new: true, upsert: true }
  )
}

const categories = async () => {
  const grouped = new Map()

  const categories = await Question.find(
    {},
    { _id: 0, category: 1, subcategory: 1 },
    { $group: 'category' }
  )

  categories.forEach(({ category, subcategory }) => {
    if (!grouped.has(category)) {
      grouped.set(category, new Set())
    }

    grouped.get(category).add(subcategory)
  })

  return grouped
}

module.exports = {
  list: list,
  create: create,
  update: update,
  categories: categories
}
