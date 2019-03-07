const School = require('../models/School')

module.exports = {

  getSuggestions: (query, callback) => {
    School.find({ $text: { $search: query } }).limit(10).exec((err, results) => {
      if (err) {
        callback(err)
      } else {
        const suggestions = results.map((result) => result.SCH_NAME)
        callback(null, suggestions)
      }
    })
  }
}
