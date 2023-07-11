const mongoose = require('mongoose');

const serviceDataSchema = new mongoose.Schema({
  serviceName: {
    type: String,
    unique: true,
    //required: true
  },
  serviceType: {
    type: String,
  },
  email: {
    type: String,
  },
  price: {
    type: Number,
  },
  contactInfo: {
    type: String,
  },
  location: {
    type: String,
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
  avgRating:{
    type: Number,
    default: 0
  }
}, 
{

  timestamps: true,
  collection: 'ServiceData'
});


module.exports = mongoose.model('ServiceData', serviceDataSchema);
