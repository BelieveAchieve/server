var mongoose = require('mongoose');

var questionSchema = new mongoose.Schema({
  questionText: String,
  possibleAnswers: [{txt: String, val: String}],
  correctAnswer: String,
  category: String,
  subcategory: String,
  image: String
});

// Given a question record, strip out sensitive data for public consumption
questionSchema.methods.parseQuestion = function(){
  return {
    _id: this._id,
    questionText: this.questionText,
    possibleAnswers: this.possibleAnswers,
    image: this.image
  };
};

questionSchema.statics.getSubcategories = function(category){
  var categoryToSubcategoryMap = {
    algebra: ['linear equations', 'rational exponents and radicals', 'application of linear equations', 'two variable equations', 'rational expressions', 'complex numbers']
  };
  var subcategories = categoryToSubcategoryMap[category];
  return subcategories;
}

module.exports = mongoose.model('Question', questionSchema, 'question');
