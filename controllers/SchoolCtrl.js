const School = require('../models/School')

// helper to escape regex special characters
function escapeRegex(str) {
  return str.replace(/[.*|\\+?{}()[^$]/g, c => '\\' + c)
}

module.exports = {
  // search for schools by name or ID
  search: function(query, cb) {
    if (query.match(/^[0-9]{8}$/)) {
      School.findByUpchieveId(query, cb)
    } else {
      const regex = new RegExp(escapeRegex(query), 'i')
      // look for both manually entered and auto-downloaded schools
      const dbQuery = School.find({
        $or: [{ nameStored: regex }, { SCH_NAME: regex }]
      })
        .sort({
          isApproved: -1
        })
        .limit(20)

      dbQuery.exec(function(err, results) {
        if (err) {
          cb(err)
        } else {
          cb(
            null,
            results
              .sort((s1, s2) => s1.name - s2.name)
              .map(school => {
                return {
                  upchieveId: school.upchieveId,
                  name: school.name,
                  districtName: school.districtName,
                  city: school.city,
                  state: school.state
                }
              })
          )
        }
      })
    }
  }
}
