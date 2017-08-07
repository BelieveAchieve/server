var Question = require('../models/Question');
var User = require('../models/User');
var ObjectId = require('mongodb').ObjectID;

// Fisher-Yates shuffle
function shuffle(origArray) {
  var array = origArray.slice(0); // clones the array
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
    var subcategories = Question.getSubcategories(options.category);

    Question.find({ 'category': options.category }, function(err, questions) {
      if (err){
        return callback(err);
      }
      else {
        var randomQuestions = [];
        var questionsBySubcategory = questions.reduce(function(acc, question) {
          var subcategory = question.subcategory;
          if (acc[subcategory] == null){
            // If null, subcategory has not been initialized, so create an array with the question in it:
            acc[subcategory] = [question]
            return acc;
          } else {
            // Since the key is not null, we can assume we have previously populated it with an array holding a question
            acc[subcategory].push(question);
            return acc;
          }
        }, {});

        // get x unique, random objects from n objects in arrays
        subcategories.map(function(subcategory) {
          var questions = questionsBySubcategory[subcategory];
          questions = shuffle(questions);
          // change depending on how many of each subcategory are wanted
          for (var i = 0; i < 1; i++) {
            var question = questions[i];
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
        questions.forEach(function(question) {
          var correctAnswer = question.correctAnswer;
          var userAnswer = idAnswerMap[question._id];
          if (correctAnswer == userAnswer) {
            score = score + 1;
          }
        });
        User.findOne({'_id': userid}, function(err, user){
          if (err){
            return callback(err);
          }
          if (!user) {
            return callback(new Error('No account with that id found.'));
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
