var QuizCtrl = require('../../controllers/QuizCtrl');

module.exports = function(router){
  router.post('/quiz/create', function(req, res){
    QuizCtrl.createQuiz(function(err, quiz){
      console.log('quiz.js about to enter if else statement');
      if (err){
        console.log('quiz.js encountered err');
        res.json({err: err});
      } else {
        console.log('quiz was ready to finish quiz.js');
        res.json({
          quiz: quiz,
          msg: 'Quiz created'
        });
      }
    });
  });
};
