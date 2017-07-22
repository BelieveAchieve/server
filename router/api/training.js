var TrainingCtrl = require('../../controllers/TrainingCtrl');

module.exports = function(router){
	router.post('/training/questions', function(req, res){
		TrainingCtrl.getQuestions({quizType: req.body.quizType}, function(err, questions){
			if (err){
				res.json({err: err});
			} else {
				res.json({
          msg: 'Questions retrieved from database',
          questions: questions
        });
			}
		});
	});
	router.post('/training/score', function(req, res){
		TrainingCtrl.getQuizScore({idAnswerMap: req.body.idAnswerMap}, function(err, score){
			if (err){
				res.json({err: err});
			} else {
				res.json({
          msg: 'Questions retrieved from database',
          score: score
        });
			}
		});
	});
};
