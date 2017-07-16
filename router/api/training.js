var mongoose = require('mongoose');

module.exports = function(router){
  router.post('/training/question', function(req, res){
    var db = mongoose.createConnection('mongodb://localhost/test');
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function() {
      var collection = db.collection('questions');
      var questions = [];
      var random = Math.floor(Math.random() * 6);
      var randomIds = [random];
      while(randomIds.length < 5) {
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
      for (var i = 0; i < randomIds.length; i++) {
        collection.findOne({'id':randomIds[i].toString()}, function (err, question) {
          if (err) {
            res.json({
              err: err
            });
          }
          else {
            questions[i] = question;
            console.log(questions);
          }
        });
      }
      res.json({
        questions : questions,
        msg: "finished getting question data"
      });
      // collection.findOne({'id':'1'}, function (err, question) {
      //   if (err) {
      //     res.json({
      //       err: err
      //     });
      //   } else {
      //     res.json({
      //       question : question,
      //       msg: "finished getting question data"
      //     });
      //   }
      // });
    });
  });
};
