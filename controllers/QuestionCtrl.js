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

const destroy = async questionId => {
  return Question.findByIdAndDelete(questionId)
}

// Return an array of tuples, with each tuple containing a category and array of
// subcategories.
//
// Example:
//
//      [
//         ['algebra', ['linear', 'rational']],
//         ['applications', ['LOR', 'basic']]
//      ]
//
const categories = async () => {
  const categories = await Question.find(
    {},
    { _id: 0, category: 1, subcategory: 1 },
    { $group: 'category' }
  )

  const groupedCategories = {}
  categories.forEach(({ category, subcategory }) => {
    if (!groupedCategories[category]) {
      groupedCategories[category] = new Set()
    }
    groupedCategories[category].add(subcategory)
  })

  const tuples = Object.keys(groupedCategories)
    .sort()
    .map(categoryName => [categoryName, [...groupedCategories[categoryName]]])

  return tuples
}

module.exports = {
  list,
  create,
  update,
  destroy,
  categories
}
