var mongoose = require('mongoose')

var feedbackSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    default: ''
  },

  topic: {
    type: String,
    default: ''
  },

  subTopic: {
    type: String,
    default: ''
  },
  
  responseData: {
    type: Object,
    default: ''
  },

  userType: {
    type: String,
    default: ''
  },

  studentId: {
    type: String,
    default: ''
  },

  volunteerId: {
    type: String,
    default: ''
  }
})

module.exports = mongoose.model('Feedback', feedbackSchema)
