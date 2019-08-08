const School = require('../models/School')

module.exports = {
  search: function (query, cb) {
    if (query.match(/^[0-9]{8}$/)) {
      School.findByUpchieveId(query, cb)
    } else {
      const regex = new RegExp(query, 'i')
      const dbQuery = School.find({
        $or: [
          { nameStored: regex },
          { SCH_NAME: regex }
        ]
      }).limit(20)

      dbQuery.exec(function (err, results) {
        if (err) {
          cb(err)
        } else {
          cb(null, results.sort((s1, s2) => s1.name - s2.name))
        }
      })
    }
  }
}
