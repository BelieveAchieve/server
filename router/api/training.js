var mongoose = require('mongoose');

module.exports = function(router){
  router.post('/training/question', function(req, res){
    var db = mongoose.createConnection('mongodb://localhost/test');
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function() {
      var collection = db.collection('questions');
      collection.findOne({'id':'1'}, function (err, question) {
        if (err) {
          res.json({
            err: err
          });
        } else {
          res.json({
            question : question,
            msg: "finished getting question data"
          });
        }
      });
    });
  });
};
