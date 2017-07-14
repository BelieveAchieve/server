var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var validator = require('validator');

var config = require('../config.js');

var questionSchema = new mongoose.Schema({
  id: String,
  questionText: String,
  possibleAnswers: [String],
  correctAnswer: String
});

module.exports = mongoose.model('Question', questionSchema);
