const mongoose = require('mongoose');

const bookingDataSchema = new mongoose.Schema({
  venueid: {
    type: String
  },
  serviceid: {
    type: String
  },
  customerEmail: {
    type: String
  },
  date: {
    type: Date,
  },
  time:{
    type: String,
  },
  status:{
    type: String,
    default: "Pending"
  }
}, 
{

  timestamps: true,
  collection: 'BookingData'
});


module.exports = mongoose.model('BookingData', bookingDataSchema);
