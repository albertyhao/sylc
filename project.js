var mongoose = require('mongoose');

var model = mongoose.model('project', new mongoose.Schema({
  projectname: {
    type: String,
    unique: true
  },
  organizationname: {
    type: String,
  },
  role: {
    type: String,
  },
  projectdescription: {
    type: String,
  },
  projectlogo: {
    type: String,
  }
}));

exports.getModel = function() {
  return model;
}
