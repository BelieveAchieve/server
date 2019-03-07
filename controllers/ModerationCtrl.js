const https = require('https')
const API_KEY = require('../config').cleanSpeakApiKey

module.exports = {

  moderateMessage: (data, callback) => {
    const req = https.request({
      hostname: 'upchieve-cleanspeak-api.inversoft.io',
      path: '/content/item/filter',
      method: 'POST',
      headers: {
        'Authorization': API_KEY,
        'Content-Type': 'application/json'
      }
    },
    (res) => {
      let resBody = ''
      res.on('data', (chunk) => {
        resBody += chunk
      })

      res.on('end', () => {
        console.log('CleanSpeak response body:', resBody)

        if (res.statusCode === 200) {
          resBody = JSON.parse(resBody)

          if (resBody.matches.length === 0) {
            callback(null, true)
          } else {
            callback(null, false)
          }
        } else {
          callback(`CleanSpeak API didn't send desired response: { statusCode: ${res.statusCode}, body: ${resBody} }`)
        }
      })
    })

    req.on('error', (err) => {
      callback(err)
    })
    req.write(JSON.stringify(data))
    req.end()
  }
}
