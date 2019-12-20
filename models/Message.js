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
},
{
  toJSON: {
    virtuals: true
  },

  toObject: {
    virtuals: true
  }
})

messageSchema.virtual('userId').get(function () {
  return this.user._id || this.user
})

messageSchema.virtual('name').get(function () {
  // only works if user is populated
  return this.user.firstname
})

messageSchema.virtual('isVolunteer').get(function () {
  // only works if user is populated
  return this.user.isVolunteer
})

messageSchema.virtual('picture').get(function () {
  // only works if user is populated
  return this.user.picture
})

module.exports = mongoose.model('Message', messageSchema)
