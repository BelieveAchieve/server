var mongoose = require('mongoose');

var questionSchema = new mongoose.Schema({
  questionText: String,
  possibleAnswers: [String],
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
    math: ['addition', 'subtraction', 'multiplication', 'division']
  };
  var subcategories = categoryToSubcategoryMap[category];
  return subcategories;
}

module.exports = mongoose.model('Question', questionSchema, 'question');
