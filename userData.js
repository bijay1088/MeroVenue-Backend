const mongoose=require('mongoose');

const userDataSchema=mongoose.Schema(
    {
        fname: String,
        email: {type: String, unique: true},
        phone: {type: String},
        password: String,
        role: String,
        banStatus: {type: Boolean, default: false},
        verified: {type: Boolean, default: false},
    },
    {
        timestamps: true,
        collection:"UserData",
    }
);

mongoose.model("UserData",userDataSchema);