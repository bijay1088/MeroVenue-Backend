const mongoose = require('mongoose');

const vendorKYCDataSchema = new mongoose.Schema({
    vendorID: {
        type: String,
        required: true,
        unique: true
    },
    documentType: {
        type: String,
        required: true
    },
    contactNumber: {
        type: String,
        required: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    documentImage:{
        type: String,
        required: true
    },
    tOS:{
        type: Boolean,
        required: true
    }
},
);
mongoose.model('VendorKYCData', vendorKYCDataSchema);
