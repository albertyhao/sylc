var mongoose = require('mongoose');

var model = mongoose.model('organization', new mongoose.Schema({
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
  officers: {
    type: String,
  },
  officerEmails: {
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
