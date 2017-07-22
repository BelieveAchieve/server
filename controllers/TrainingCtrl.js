var Question = require('../models/Question');
var ObjectId = require('mongodb').ObjectID;

module.exports = {
  getQuestions: function(options, callback){
    var quizType = JSON.parse(JSON.stringify(options.quizType));

    Question.aggregate({ $match: { 'type' : quizType } }).sample(4).exec(function(err, questions) {
      questions.map(function(currentValue) {
        var parsedQuestion = (new Question(currentValue)).parseQuestion();
        return parsedQuestion;
      });
      return callback(null, questions);
    });
  },
  getQuizScore: function(options, callback){
    var idAnswerMap = options.idAnswerMap;
    var score = 0;
    var answer;
    var obj_ids = Object.keys(idAnswerMap);
    Question.find({'_id': {$in: obj_ids}}, function(err, questions) {
      if (err){
        return callback(err);
      }
      else {
        questions.map(function(question) {
          var correctAnswer = question.correctAnswer;
          var userAnswer = idAnswerMap[question._id];
          if (correctAnswer == userAnswer) {
            score = score + 1;
          }
        });
        return callback(null, score);
      }
    });
  }
};
