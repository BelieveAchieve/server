var Question = require('../models/Question');
var User = require('../models/User');
var ObjectId = require('mongodb').ObjectID;

// Fisher-Yates shuffle
function shuffle(array) {
  var currIndex = array.length,
      tempValue,
      randomIndex;

  // while there are still elements to shuffle
  while (0 != currIndex) {
    // pick a remaining element
    randomIndex = Math.floor(Math.random() * currIndex);
    currIndex -= 1;

    // swap it with the current element
    tempValue = array[currIndex];
    array[currIndex] = array[randomIndex];
    array[randomIndex] = tempValue;
  }

  return array;
}

module.exports = {
  getQuestions: function(options, callback){
    var category = JSON.parse(JSON.stringify(options.category));
    var subcategories = Question.getSubcategories(category);

    // create an array of arrays of questions (divided by subcategory)
    var questionsBySubcategory = [];
    subcategories.map(function(subcategory) {
      questionsBySubcategory[subcategory] = [];
    });

    Question.find({ 'category': category }, function(err, questions) {
      if (err){
        return callback(err);
      }
      else {
        var randomQuestions = [];

        // sort questions by subcategory into arrays
        questions.map(function(question) {
          var subcategory = question.subcategory;
          questionsBySubcategory[subcategory].push(question);
        });

        // get x unique, random objects from n objects in arrays
        subcategories.map(function(subcategory) {
          var questions = questionsBySubcategory[subcategory];
          // initialize array of values from 0 to questions.length - 1
          var array = [];
          for (var i = 0; i < questions.length; i++) {
            array[i] = i;
          }
          array = shuffle(array);

          // change depending on how many of each subcategory are wanted
          for (var i = 0; i < 2; i++) {
            var index = array[i];
            var question = questions[index];
            randomQuestions.push(question);
          }
        });

        randomQuestions = shuffle(randomQuestions);
        return callback(null, randomQuestions);
      }
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
          user.score = score;
          user.save(function(err, user){
            if (err){
              callback(err, null)
            } else {
              callback(null, score)
            }
          });
        });
      }
    });
  }
};
