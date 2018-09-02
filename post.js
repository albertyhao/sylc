var mongoose = require('mongoose');

var model = mongoose.model('post', new mongoose.Schema({
  title: {
    type: String,
  },
  author: {
    type: mongoose.Schema.ObjectId,ref:'user'
  },
  file: {
    type: String
  },
  contents: {
    type: String,
  },
  dateCreate: {
    type: Date
  }
}));

exports.getModel = function() {
  return model;
}
