var SessionCtrl = require('../../controllers/SessionCtrl');

module.exports = function(router){
	router.route('/session/new')
		.post(function(req, res){
			var data = req.body || {},
					sessionType = data.sessionType,
					user = req.user;

			SessionCtrl.create({
				user: user,
				type: sessionType
			}, function(err, session){
				if (err){
					res.json({
						err: err
					});
				} else {
					res.json({
						sessionId: session._id
					});

				}
			});
		});

	router.route('/session/check')
		.post(function(req, res){
			var data = req.body || {},
					sessionId = data.sessionId;

			SessionCtrl.get({
				sessionId: sessionId
			}, function(err, session){
				if (err){
					res.json({
						err: err
					});
				} else if (!session) {
					res.json({
						err: 'No session found'
					});
				} else {
					res.json({
						sessionId: session._id
					});
				}
			});
		});
};
