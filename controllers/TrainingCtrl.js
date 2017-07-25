var Question = require('../models/Question');
var User = require('../models/User');
var ObjectId = require('mongodb').ObjectID;

module.exports = {
  getQuestions: function(options, callback){
    var category = JSON.parse(JSON.stringify(options.category));

    Question.aggregate({ $match: { 'category' : category } }).sample(4).exec(function(err, questions) {
      questions.map(function(currentValue) {
        var parsedQuestion = (new Question(currentValue)).parseQuestion();
        return parsedQuestion;
      });
      return callback(null, questions);
    });
  },
  getQuizScore: function(options, callback){
    var userid = options.userid;
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
        User.findOne({'_id': userid}, function(err, user){
          if (err){
            return done(err);
          }
          if (!user) {
            return done(new Error('No account with that id found.'));
          }
          user.save(function(err) {
            score: score
          });
          console.log(user);
          console.log(user.score);
          return callback(null, score);
        });
      }
    });
  }
};
