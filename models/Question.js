var mongoose = require('mongoose')

var questionSchema = new mongoose.Schema({
  questionText: String,
  possibleAnswers: [{ txt: String, val: String }],
  correctAnswer: String,
  category: String,
  subcategory: String,
  imageSrc: String
})

// Given a question record, strip out sensitive data for public consumption
questionSchema.methods.parseQuestion = function() {
  return {
    _id: this._id,
    questionText: this.questionText,
    possibleAnswers: this.possibleAnswers,
    imageSrc: this.image
  }
}

questionSchema.statics.getSubcategories = function(category) {
  var categoryToSubcategoryMap = {
    algebra: [
      'linear equations',
      'rational exponents and radicals',
      'application of linear equations',
      'two variable equations',
      'rational expressions',
      'complex numbers'
    ],
    geometry: [
      'congruence and similarity',
      'vertices',
      'angles',
      'circles',
      'triangles',
      'rectangles'
    ],
    trigonometry: [
      'angles',
      'triangles',
      'right triangles',
      'quadrants',
      'radians',
      'unit circle',
      'inequalities'
    ],
    precalculus: [
      'rectangular coordinates',
      'linear inequalities',
      'functions',
      'rational exponents',
      'quadratic functions',
      'logarithms and exponents'
    ],
    calculus: [
      'antiderivatives',
      'derivatives',
      'limits',
      'critical numbers',
      'functions'
    ],
    planning: ['exam', 'type', 'LOR', 'basic'],
    essays: [
      'basic',
      'commonapp',
      'answer',
      'dhistory',
      'optional',
      'supplemental'
    ],
    applications: [
      'timeline',
      'resume',
      'schools',
      'fees',
      'FinAid',
      'LOR',
      'basic'
    ],
    prealgebra: [
      'arithmetic properties',
      'exponents',
      'exponents and radicals',
      'polynomials',
      'wordproblems'
    ]
  }
  if (typeof category !== 'string') {
    throw new TypeError(
      'Category has a value of ' +
        category +
        '. It must be a string, not ' +
        typeof category
    )
  }

  category = category.toLowerCase()

  if (categoryToSubcategoryMap.hasOwnProperty(category)) {
    const subcategories = categoryToSubcategoryMap[category]
    return subcategories
  } else {
    throw new ReferenceError(category + ' is not a subcategory.')
  }
}

module.exports = mongoose.model('Question', questionSchema, 'question')
