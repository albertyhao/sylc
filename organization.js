var mongoose = require('mongoose');

var model = mongoose.model('makegroup', new mongoose.Schema({
  name: {
    type: String,
    unique: true
  },
  email: {
    type: String,
  },
  address: {
    type: String,
  },
  phoneNumber: {
    type: String,
  },
  members: {
    type: String,
  },
  membersEmails: {
    type: String,
  },
  description: {
    type: String,
  },
  logo: {
    type: String,
  },
  password: {
    type: String
  },
  salt: {
    type: String
  }
}));

exports.getModel = function() {
  return model;
}
