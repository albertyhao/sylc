var mongoose = require('mongoose');

var model = mongoose.model('post', new mongoose.Schema({
  name: {
    type: String,
  },
  quantity: {
    type: String,
  },
  image: {
    type: String
  },
//  file: {
//    type: Binary,
//  },
  organization: {
    type: Boolean,
  },
  price: {
    type: String,
  },
  description: {
    type: String,
  },
  promo: {
    type: String,
  },
  Rating: {
    type: String
  }
}));

exports.getModel = function() {
  return model;
}
