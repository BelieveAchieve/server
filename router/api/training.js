var TrainingCtrl = require('../../controllers/TrainingCtrl');

module.exports = function(router){
	router.post('/training/questions', function(req, res){
		TrainingCtrl.getQuestions({}, function(err, questions){
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
};
