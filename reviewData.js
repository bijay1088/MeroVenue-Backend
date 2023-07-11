const mongoose = require('mongoose');

const reviewDataSchema = new mongoose.Schema({
  reviewSubject:{
    type: String,
  },
  reviewDesc:{
    type: String,
  },
  fname:{
    type: String
  },
  productID:{
    type: String
  }
}, 
{
  timestamps: true,
  collection: 'ReviewData'
});


module.exports = mongoose.model('ReviewData', reviewDataSchema);
