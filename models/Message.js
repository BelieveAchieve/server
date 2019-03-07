var mongoose = require('mongoose')

var messageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  contents: String,
  // session: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Session'
  // },
  createdAt: {
    type: Date,
    default: Date.now
  }

})

module.exports = mongoose.model('Message', messageSchema)
