var SessionCtrl = require('../../controllers/SessionCtrl');
var ObjectId = require('mongodb').ObjectId;

module.exports = function(router){
	router.route('/session/new')
		.post(function(req, res){
			var data = req.body || {},
					sessionType = data.sessionType,
					sessionSubTopic = data.sessionSubTopic,
					user = req.user;
			SessionCtrl.create({
				user: user,
				type: sessionType,
				subTopic: sessionSubTopic
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

  router.route('/session/end')
    .post(function(req, res){
      var data = req.body || {},
          sessionId = data.sessionId;

      SessionCtrl.get({
        sessionId: sessionId
      }, function(err, session){
        if (err){
          res.json({err: err});
        } else if (!session) {
          res.json({err: 'No session found'});
        } else {
          session.endSession();
          res.json({ sessionId: session._id });
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
						sessionId: session._id,
						whiteboardUrl: session.whiteboardUrl
					});
				}
			});
		});

router
  .route('/session/current')
  .post(function(req, res){
    const data = req.body || {};
    const { user_id, is_volunteer } = data;

    let studentId = null;
    let volunteerId = null;

    if (is_volunteer) {
      volunteerId = user_id
    } else {
      studentId = user_id
    }

    SessionCtrl
      .findLatest(
        {
          $and: [
            { endedAt: null },
            {
              $or: [
                { student: ObjectId(studentId) },
                { volunteer: ObjectId(volunteerId) }
              ]
            }
          ]
        },
        function(err, session){
          if (err){
            res.json({err: err});
          } else if (!session) {
            res.json({err: 'No session found'});
          } else {
            res.json({
              sessionId: session._id,
              data: session
            });
          }
        });
    });
};
