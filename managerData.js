const mongoose = require('mongoose');

const toDoSchema = new mongoose.Schema({
  text: { type: String, required: true },
  done: { type: Boolean, default: false }
}, { _id: false });

const managerDataSchema = new mongoose.Schema({
  title: {
    type: String,
    //required: true
  },
  venueID: {
    type: String,
    //required: true
  },
  serviceID: {
    type: [String],
    //validate: [arrayLimit, '{PATH} must have at least one venue type.']
  },
  toDoList: {
    type: [toDoSchema],
    //required: true
  },
  userEmail: {
    type: String,
  },
  active:{
    type: Boolean, 
    default: true
  },
  checkoutStatus: {
    type: Boolean,
    default: false
  },
},
{

  timestamps: true,
  collection: 'ManagerData'
});


module.exports = mongoose.model('ManagerData', managerDataSchema);
