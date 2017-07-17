var async = require('async');
var crypto = require('crypto');
var mongoose = require('mongoose');

module.exports = {
  getQuestions: function(options, callback){
    var quizType = JSON.stringify(options.quizType);

    async.waterfall([

      function(done){
        var random = Math.floor(Math.random() * 6);
        var randomIds = [random];
        while (randomIds.length < 5) {
          var isRepeat = true;
          while (isRepeat) {
            random = Math.floor(Math.random() * 6);
            for (var i = 0; i < randomIds.length; i++) {
              if (randomIds[i] == random) {
                break;
              }
              else if (i == randomIds.length - 1) {
                isRepeat = false;
                randomIds[randomIds.length] = random;
              }
            }
          }
        }
        console.log(randomIds);
        done(null, randomIds);
      },

      function(randomIds, done){
        var db = mongoose.createConnection('mongodb://localhost/test');
        db.on('error', console.error.bind(console, 'connection error:'));
        db.once('open', function() {
          var collection = db.collection(quizType);
          console.log(collection);
          var questions = [];
          randomIds.forEach(function(item, index) {
            collection.findOne({'id':item.toString()}, function (err, question) {
              if (err) {
                return done(err);
              }
              else {
                questions[index] = question;
                if (questions.length == 5) {
                  done(null, questions);
                }
              }
            });
          });
        });
      },
    ], callback);
  },
};
