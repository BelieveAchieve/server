var mongoose = require('mongoose');
var Question = require('../../models/Question');

module.exports = function(router){
  router.post('/training/question', function(req, res){
    var db = mongoose.createConnection('mongodb://localhost/test');
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function() {
      Question.findOne({'id':'1'}, function (err, question) {
        if (err) {
          res.json({
            err: err
          });
        } else {
          console.log('question data: ', question);
          res.json({
            msg: "finished getting question data"
          });
        }
      });
    });
  });
};
