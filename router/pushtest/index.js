const admin = require('firebase-admin')
const express = require('express')

module.exports = function(app) {
  admin.initializeApp({
    projectId: 877923781231, // TODO: move to config
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_PRIVATE_KEY_JSON))
  });

  app.use('/pushtest', function(req, res, next) {
    const title = req.query.title || "Test title";
    const text = req.query.text || "Test text";
    const dataStr = req.query.data || JSON.stringify({path: "/session/math/algebra"});
    const token = req.query.token;

    admin.messaging().send({
      token: token, // can also send to a topic (group of people)
      // ios and android process data a little differently, so setup separate objects for each
      apns: {
        payload: Object.assign({
          data: JSON.parse(dataStr)
        }, {
          aps: {
            alert: {
              title: title,
              body: text,
              "content-available": 1
            }
          }
        })
      },
      android: {
        priority: 1,
        data: {
          title: title,
          body: text,
          message: text,
          // image: imageUrl,
          payload: dataStr,
          "content-available": "1",
          // type: message.type,
          icon: "notification_icon",
          color: "#16d2aa",
        }
      }
    })
    .then((response) => {
      res.json(response);
    })
    .catch((err) => {
      res.json(err)
    });

  })
}
