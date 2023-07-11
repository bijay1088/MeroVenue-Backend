const mongoose = require('mongoose');

const venueDataSchema = new mongoose.Schema({
  venueName: {
    type: String,
    unique: true,
    //required: true
  },
  venueType: {
    type: [String],
    //validate: [arrayLimit, '{PATH} must have at least one venue type.']
  },
  email: {
    type: String,
  },
  price: {
    type: Number,
    //validate: [arrayLimit, '{PATH} must have at least one package option.']
  },
  contactInfo: {
    type: String,
    //required: true
  },
  location: {
    type: String,
    //required: true
  },
  locationCoordinates: {
    type: [String],
  },
  image: {
    type: String, 
    required: true
  },
  image2:{
    type: String,
  },
  image3: {
    type: String,
  },
  about: {
    type: String,
    //required: true
  },
  capacity: {
    type: Number,
    //required: true
  },
  avgRating: {
    type: Number,
    default: 0
  }  
  
}, 
{

  timestamps: true,
  collection: 'VenueData'
});


module.exports = mongoose.model('VenueData', venueDataSchema);
