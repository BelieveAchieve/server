const admin = require('firebase-admin')

const sendToUser = ({ title, text, dataStr, tokens }) => {
  return admin.messaging().sendMulticast({
    tokens, // can also send to a topic (group of people)
    // ios and android process data a little differently, so setup separate objects for each
    apns: {
      payload: Object.assign(
        {
          data: JSON.parse(dataStr)
        },
        {
          aps: {
            alert: {
              title: title,
              body: text,
              'content-available': 1
            }
          }
        }
      )
    },
    android: {
      priority: 1,
      data: {
        title: title,
        body: text,
        message: text,
        // image: imageUrl,
        payload: dataStr,
        'content-available': '1',
        // type: message.type,
        icon: 'notification_icon',
        color: '#16d2aa'
      }
    }
  })
}

module.exports = {
  sendVolunteerJoined: async function(type, subTopic, tokens) {
    const data = {
      title: 'A volunteer joined!',
      text: 'A volunteer has joined your session!',
      dataStr: JSON.stringify({
        path: `/session/${type}/${subTopic}`
      }),
      tokens
    }

    return sendToUser(data)
  }
}
