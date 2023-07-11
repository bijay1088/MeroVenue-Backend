const mongoose = require('mongoose');

const ratingDataSchema = new mongoose.Schema({
  productID:{
    type: String,
  },
  customerEmail:{
    type: String,
  },
  rating:{
    type: Number
  }
}, 
{
  timestamps: true,
  collection: 'RatingData'
});


module.exports = mongoose.model('RatingData', ratingDataSchema);
