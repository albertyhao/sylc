var mongoose = require('mongoose');
var Schema = mongoose.Schema

var model = mongoose.model('user', new Schema({
  username: {
    type: String,
    unique: true
  },
  password: {
    type: String
  },
  profile_picture:{
    type: String
  },
  name: {
    type: String
  },
  salt: {
    type: String
  },
  organization:[{
    type: Schema.ObjectId,ref:'Organization'
  }],
  following: {
    type: Schema.ObjectId,ref:'User'
  },
  email: {
    type: String
  },
  role: {
      type: String, enum: ['admin', 'user'], default: 'user'
  }

}));

exports.getModel = function() {
  return model;
}
