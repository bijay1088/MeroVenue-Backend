const express = require('express');
const app = express();
const mongoose=require('mongoose');
const bodyParser = require('body-parser');
app.use(express.json());
const cors = require('cors');
app.use(cors());
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = "ashfhsasf45d4f5s4d{}sdfdsmfkmds"
const multer = require('multer');
const fs = require('fs');
const { error, Console } = require('console');
const serviceData = require('./serviceData');
app.use('/uploads', express.static('uploads'));
app.use('/kyc-uploads', express.static('kyc-uploads'));

const mongoUrl = "KEY HERE" //insert key here



mongoose.connect(mongoUrl,{
    useNewUrlParser:true

}).then(()=>{console.log("connected to db")}
).catch((err)=>{console.log(err)});


//storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads';
    cb(null, dir);              
  },
  filename: (req, file, cb) => {
    // Replace spaces with underscores in venueName
    let imageName = undefined;
    if(req.body.venueName == undefined){
      imageName = req.body.serviceName.replace(/ /g, '_');
    }else{
      imageName = req.body.venueName.replace(/ /g, '_');
    } 
    extension = file.mimetype.split('/')[1];
  
    // Check if file with this name already exists
    fs.readdir('uploads', (err, files) => {
      if (err) {
        cb(err);
        return;
      }
  
      let fileName = `${imageName}.${extension}`;
      let i = 1;
  
      while (files.includes(fileName)) {
        fileName = `${imageName}-${i}.${extension}`;
        i++;
      }
  
      cb(null, fileName);
    });
  }
  
});



const fileFilter = (req, file, cb) => {
  // Allow only image files with extensions .jpg, .jpeg, .png
  if (
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
    return cb(new Error('Only .jpg, .jpeg, .png format allowed!'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5, // 5 MB limit
  },
});

const KYCstorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'kyc-uploads'; // Destination directory for KYC images
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const vendorID = req.body.vendorID.replace(/ /g, '_');
    const extension = file.mimetype.split('/')[1];
  
    // Check if file with this name already exists
    fs.readdir('uploads', (err, files) => {
      if (err) {
        cb(err);
        return;
      }
  
      let fileName = `${vendorID}.${extension}`;
      let i = 1;
  
      while (files.includes(fileName)) {
        fileName = `${vendorID}-${i}.${extension}`;
        i++;
      }
  
      cb(null, fileName);
    });
  }
});


const uploadKYC = multer({
  storage: KYCstorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5, // 5 MB limit
  },
});






//nodemon app
app.listen(5000, () => {
  console.log('Server started on port 5000');
});


require("./userData");
require("./venueData");
require("./vendorKYCData");
require("./serviceData");
require ("./managerData");
require("./bookingData");
require("./ratingData");
require("./reviewData");

const User = mongoose.model("UserData");
const VenueData = mongoose.model("VenueData");
const VendorKYCData = mongoose.model("VendorKYCData");
const ServiceData = mongoose.model("ServiceData");
const ManagerData = mongoose.model("ManagerData");
const BookingData = mongoose.model("BookingData");
const RatingData = mongoose.model("RatingData");
const ReviewData = mongoose.model("ReviewData");





//registration
app.post('/register', async (req, res) => {
  const {fname,email,password,role} = req.body;

  const encryptedPassword = await bcrypt.hash(password, 10);
  try{
    const oldUser = await User.findOne({email});

    if(oldUser){
      return res.send({status: "error", message: "User already exists!"});
    } 
    
    if(role == "Vendor"){
      await User.create({fname,email,password:encryptedPassword,role, verified: false});
    }
    else{
      await User.create({fname,email,password:encryptedPassword,role, verified: true});
    }
    const user = await User.findOne({email});
    const token = jwt.sign({
      email: user.email
    }, JWT_SECRET);
    res.send({status: "success", message: "User created successfully!", data: token});
  }
  catch(error){
    res.send({status: "error", message: "User not created!"});
  }
});

//login
app.post('/login', async (req, res) => {
  const {email,password, role} = req.body;

  const user = await User.findOne({email});

  if(!user){
    return res.send({status: "error", message: "User not found!"});
  }

  if(user.banStatus == true){
    return res.send({status: "error", message: "You have been banned!"});
  }

  if(await bcrypt.compare(password, user.password)){
    const token = jwt.sign({
      email: user.email
    }, JWT_SECRET);

    //compare role
    if(user.role == role){

      if(res.status(201)){
        return res.send({status: "success", message: "User logged in successfully!", data: token});
      }
      else{
        return res.send({status: "error", message: "User not logged in!"});
      }
      
    }
    else{
      return res.send({status: "error", message: "No user with this role!"});
    }

    
  }
  res.json({status: "error", message: "Invalid username/password"});
});

//get user data

app.post('/user', async (req, res) => {
  const {token} = req.body;

  try{
    const user = jwt.verify(token, JWT_SECRET);
    const useremail = user.email;
    User.findOne({email:useremail}).then((data)=>{
      res.send({status:"success", data:data});
    })
  }
  catch(error){
    res.send({status: "error", message: error});
  }
});

//get all users
app.post('/getAllUsers', async (req, res) => {
  const {token} = req.body;
  try{
    const user = jwt.verify(token, JWT_SECRET);

    //check if user is admin or not by finding their role 
    const useremail = user.email;
    User.findOne({email:useremail}).then((data)=>{
      if(data.role == "Admin"){
        User.find().then((data)=>{
          res.send({status:"success", data:data});
        })
      }
      else{
        res.send({status: "error", message: "You are not an admin!"});
      }
    })
    
  }
  catch(error){
    res.send({status: "error", message: error});
  }
});

//get user email from token
app.post('/getUserEmail', async (req, res) => {
  const {token} = req.body;
  try{
    const user = jwt.verify(token, JWT_SECRET);
    const useremail = user.email;
    res.send({status:"success", data:useremail});
  }
  catch(error){
    res.send({status: "error", message: error});
  }
});



//delete user
app.delete('/deleteUser', async (req, res) => {
  const {token, id} = req.body;
  try{
    const user = jwt.verify(token, JWT_SECRET);
    const useremail = user.email;
    User.findOne({email:useremail}).then((data)=>{
    if(data.role == "Admin"){
      User.findByIdAndDelete(id).then((data)=>{
        res.send({status:"success", data:data});
      })
    }
    else{
      res.send({status: "error", message: "You are not an admin!"});
    }
  })
  }
  catch(error){
    res.send({status: "error", message: error});
  }

});

//ban user
app.put('/banUser', async (req, res) => {
  const {token, id} = req.body;
  try{
    const user = jwt.verify(token, JWT_SECRET);
    const useremail = user.email;
    User.findOne({email:useremail}).then((data)=>{
    if(data.role == "Admin"){
      User.findByIdAndUpdate(id, {banStatus: true}).then((data)=>{
        res.send({status:"success", data:data});
      })
    }
    else{
      res.send({status: "error", message: "You are not an admin!"});
    }
  })
  }
  catch(error){
    res.send({status: "error", message: error});
  }
});


//unban user
app.put('/unbanUser', async (req, res) => {
  const {token, id} = req.body;
  try{
    const user = jwt.verify(token, JWT_SECRET);
    const useremail = user.email;
    User.findOne({email:useremail}).then((data)=>{
    if(data.role == "Admin"){
      User.findByIdAndUpdate(id, {banStatus: false}).then((data)=>{
        res.send({status:"success", data:data});
      })
    }
    else{
      res.send({status: "error", message: "You are not an admin!"});
    }
  })
  }
  catch(error){
    res.send({status: "error", message: error});
  }
});

//for kyc
app.post('/kyc', uploadKYC.array('documentImage', 1), async (req, res) => {
  const {vendorID, contactNumber, dateOfBirth, address, documentType, tOS } = req.body;
  try {
    // Check if kyc with the same vendorID already exists
    const existingKYC = await VendorKYCData.findOne({ vendorID });
    if (existingKYC) {
      return res.status(400).send({
        status: "error",
        message: "You have already filled your KYC!"
      });
    }

    const newKYCData = await VendorKYCData.create({
      vendorID,
      contactNumber,
      dateOfBirth,
      address,
      documentType,
      documentImage: req.files && req.files[0].path,
      tOS
    });
    res.send({status: "success", message: "KYC filled successfully!"});
  } catch (error) {
    console.log(error);
    res.status(500).send({
      status: "error",
      message: "Something went wrong!"
    });
  }
});

//get kyc
app.post('/getVendorKYC', async (req, res) => {
  const {vendorID} = req.body;
  try{
    const data = await VendorKYCData.find({vendorID});
    res.send({status:"success", data:data});
  }
  catch(error){
    res.send({status: "error", message: error});
  }
});

//for service registration
app.post('/service', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 },
]), async (req, res) => {
  const { serviceName, serviceType, email, price, contactInfo, location, locationCoordinates, about } = req.body;
  try {
    // Check if service with the same name already exists
    const existingService = await ServiceData.findOne({ serviceName });
    if (existingService) {
      return res.status(400).send({
        status: "error",
        message: "Service with the same name already exists!"
      });
    }
    const newServiceData = await ServiceData.create({
      serviceName,
      serviceType,
      email,
      price,
      contactInfo,
      location,
      locationCoordinates,
      image: req.files && req.files['image'] && req.files['image'][0].path,
      image2: req.files && req.files['image2'] && req.files['image2'][0].path,
      image3: req.files && req.files['image3'] && req.files['image3'][0].path,
      about
    });
    res.send({status: "success", message: "Service registered successfully!"});
  } catch (error) {
    console.log(error);
    res.status(500).send({
      status: "error",
      message: "Something went wrong!"
    });
  }
});

//get all services
app.get('/getAllServices', async (req, res) => {
  try{
    const data = await ServiceData.find();
    res.send({status:"success", data:data});
  }
  catch(error){
    res.send({status: "error", message: error});
  }
});

//get specific service
app.get('/getService/:id', async (req, res) => {
  const id = req.params.id;
  try{
    const data = await ServiceData.findById(id);
    res.send({status:"success", data:data});
  }
  catch(error){
    res.send({status: "error", message: error});
  }
});




//for venue registration
app.post('/venue', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 },
]), async (req, res) => {
  const { venueName, venueType, email, price, contactInfo, location, locationCoordinates, about, capacity } = req.body;
  try {
    // Check if venue with the same name already exists
    const existingVenue = await VenueData.findOne({ venueName });
    if (existingVenue) {
      return res.status(400).send({
        status: "error",
        message: "Venue with the same name already exists!"
      });
    }

    const newVenueData = await VenueData.create({
      venueName,
      venueType,
      email,
      price,
      contactInfo,
      location,
      locationCoordinates,
      image: req.files && req.files['image'] && req.files['image'][0].path,
      image2: req.files && req.files['image2'] && req.files['image2'][0].path,
      image3: req.files && req.files['image3'] && req.files['image3'][0].path,
      about,
      capacity
    });

    res.send({
      status: "success",
      message: "Venue created successfully!"
    });

  } catch (error) {
    console.error(error);
    res.status(500).send({
      status: "error",
      message: "Failed to create venue! "+ error
    });
  }
});


//edit venue price
app.post('/editVenuePrice', async (req, res) => {
  const { venueID, price } = req.body;
  try {
    await VenueData.findByIdAndUpdate(venueID, { price: price });
    res.send({ status: 'success', message: 'Price updated successfully!' });
  } catch (error) {
    console.log(error);
    res.send({ status: 'error', message: error });
  }
});


//edit service price
app.post('/editServicePrice', async (req, res) => {
  const { serviceID, price } = req.body;
  try {
    await ServiceData.findByIdAndUpdate(serviceID, { price: price });
    res.send({ status: 'success', message: 'Price updated successfully!' });
  } catch (error) {
    console.log(error);
    res.send({ status: 'error', message: error });
  }
});



//get specific venue data
app.get('/getVenue/:id', async (req, res) => {
  try {
    const data = await VenueData.findById(req.params.id);
    res.send({ status: 'success', data });
  } catch (error) {
    res.send({ status: 'error', message: error });
  }
});

//get all venue data
app.get('/getAllVenue', async (req, res) => {
  try {
    const data = await VenueData.find();
    res.send({ status: 'success', data });
  } catch (error) {
    res.send({ status: 'error', message: error });
  }
});

// get specific category venue data
app.get('/getCategoryVenue/:category', async (req, res) => {
  try {
    const data = await VenueData.find({ venueType: { $in: [req.params.category] } });
    console.log(data);
    res.send({ status: 'success', data });
  } catch (error) {
    res.send({ status: 'error', message: error });
  }
});





//get unverified venue data
app.get('/getUnverifiedVendor', async (req, res) => {
  try{
    const user = await User.find({verified:false});
    res.send({status:"success", data:user});
  }
  catch(error){
    res.send({status: "error", message: error});
  }
});

//get verified venue data
app.get('/getVendor', async (req, res) => {
  try{
    const user = await User.find({role:"Vendor"});
    res.send({status:"success", data:user});
  }
  catch(error){
    res.send({status: "error", message: error});
  }
});





//delete venue
app.delete('/deleteVenue', async (req, res) => {
  const {token, id} = req.body;

  try{

    const user = jwt.verify(token, JWT_SECRET);
    const useremail = user.email;
    User.findOne({email:useremail}).then((data)=>{
    if(data.role == "Admin"){ 
      VenueData.findByIdAndDelete(id).then((data)=>{
        res.send({status:"success", data:data});
      })
  }
  else{
    res.send({status: "error", message: "You are not an admin!"});
  }
})
  }
  catch(error){
    res.send({status: "error", message: error});
  }
});

//verify venue
app.put('/verifyVendor', async (req, res) => {
  const {token,id} = req.body;

  try{
    const user = jwt.verify(token, JWT_SECRET);
    const useremail = user.email;
    User.findOne({email:useremail}).then((data)=>{
    if(data.role == "Admin"){
      User.findByIdAndUpdate(id,{verified:true}).then((data)=>{
      res.send({status:"success", data:data});
    })
  }
    else{
      res.send({status: "error", message: "You are not an admin!"});
    }
  })
  }
  catch(error){
    res.send({status: "error", message: error});
  }
});

//unverify venue
app.put('/unverifyVendor', async (req, res) => {
  const {token,id} = req.body;
  try{
    const user = jwt.verify(token, JWT_SECRET);
    const useremail = user.email;
    User.findOne({email:useremail}).then((data)=>{
    if(data.role == "Admin"){
      User.findByIdAndUpdate(id,{verified:false}).then((data)=>{
      res.send({status:"success", data:data});
    })
  
  }
    else{
      res.send({status: "error", message: "You are not an admin!"});
    }
  })
  }
  catch(error){
    res.send({status: "error", message: error});
  }
});

//add manager
app.post('/addManager', async (req, res) => {
  const {token, title, venueID, serviceID,toDoList } = req.body;
  try{
    const user = jwt.verify(token, JWT_SECRET);
    const userEmail = user.email;
      const newManager = new ManagerData({
        title,
        venueID,
        serviceID,
        toDoList,
        userEmail
      });
      newManager.save().then((data)=>{
        res.send({status:"success", data:data});
      })
  }
  catch(error){
    res.send({status: "error", message: error});
  }
});

//get manager
app.post('/getManager', async (req, res) => {
  const {token} = req.body;
  try{
    const user = jwt.verify(token, JWT_SECRET);
    const userEmail = user.email;
    //create an object to store all the data
    var managerData = {venue: [], service: []};
    const managerDocs = await ManagerData.find({userEmail:userEmail, active: true});
    if(managerDocs[0].venueID){
      const venueDocs = await VenueData.find({_id:managerDocs[0].venueID});
      managerData.venue.push(...venueDocs);
    }
    if(managerDocs[0].serviceID){
      const serviceDocs = await ServiceData.find({_id: {$in: managerDocs[0].serviceID}});
      managerData.service.push(...serviceDocs);
    }
    res.send({status:"success", data:managerData});
  }
  catch(error){
    res.send({status: "error", message: error});
  }
});

//set todo list
app.post('/setToDoList', async (req, res) => {
  const {token, toDoList } = req.body;
  try{
    const user = jwt.verify(token, JWT_SECRET);
    const userEmail = user.email;
    ManagerData.findOneAndUpdate({userEmail:userEmail, active:true}, {toDoList:toDoList}).then((data)=>{
      res.send({status:"success", data:data});
    })
  }
  catch(error){
    res.send({status: "error", message: error});
  }
});

//get todo list
app.post('/getToDoList', async (req, res) => {
  const { token } = req.body;
  try {
    const user = jwt.verify(token, JWT_SECRET);
    const userEmail = user.email;
    const data = await ManagerData.findOne({ userEmail, active: true }).lean().exec();
    const toDoList = data.toDoList.map((item) => {
      return { text: item.text, done: item.done };
    });
    res.send({ status: "success", data: toDoList });
  } catch (error) {
    console.error(error);
    res.send({ status: "error", message: "An error occurred" });
  }
});



//set venue package
app.post('/setPackageVenue', async (req, res) => {
  const {token, venueID } = req.body;
  try{
    const user = jwt.verify(token, JWT_SECRET);
    const userEmail = user.email;
    //check if there is any active venue
    ManagerData.findOne({userEmail:userEmail, active:true}).then((data)=>{
      if(data){
        if(data.venueID){
          console.log("Active venue");
          res.send({status:"active", message:"You have an active venue!"});
        } 
        else{
          ManagerData.findOneAndUpdate({userEmail:userEmail, active:true}, {venueID:venueID}).then((data)=>{
            res.send({status:"success", data:data});
          })
        }
      }
      else{
        const newManager = new ManagerData({
          venueID:venueID,
          userEmail:userEmail
        });
        newManager.save().then((data)=>{
          res.send({status:"success", data:data});
        }
        )

      }
    })
  }
  catch(error){
    res.send({status: "error", message: error});
  }
});

//set service package
app.post('/setPackageService', async (req, res) => {
  const {token, serviceID } = req.body;
  try{
    const user = jwt.verify(token, JWT_SECRET);
    const userEmail = user.email;
    ManagerData.findOne({userEmail:userEmail, active:true}).then((data)=>{
      if(data){
        if (data.serviceID.includes(serviceID)) {
          res.send({ status: "exist", message: "This service already exists" });
        } else {
          ManagerData.findOneAndUpdate(
            { userEmail: userEmail, active: true },
            { $push: { serviceID: serviceID } }
          ).then((data) => {
            res.send({ status: "success", data: data });
          });
        }
      }
      else{
        const newManager = new ManagerData({
          serviceID:serviceID,
          userEmail:userEmail
        });
        newManager.save().then((data)=>{
          res.send({status:"success", data:data});
        }
        )

      }
    })
  }
  catch(error){
    res.send({status: "error", message: error});
  }
});

//checkout
app.post('/checkout', async (req, res) => {
  const {token} = req.body;
  try{
    const user = jwt.verify(token, JWT_SECRET);
    const userEmail = user.email;
    ManagerData.findOneAndUpdate({userEmail:userEmail, active:true}, {active:false}).then((data)=>{
      res.send({status:"success", data:data});
    })
  }
  catch(error){
    res.send({status: "error", message: error});
  }
});

//get number of users
app.get('/getNumberOfUsers', async (req, res) => {
  try{
    const data = await User.find();
    res.send({status:"success", data:data.length});
  }
  catch(error){
    res.send({status: "error", message: error});
  }
});

//get number of venues
app.get('/getNumberOfVenues', async (req, res) => {
  try{
    const data = await VenueData.find();
    res.send({status:"success", data:data.length});
  }
  catch(error){
    res.send({status: "error", message: error});
  }
});

//get number of services
app.get('/getNumberOfServices', async (req, res) => {
  try{
    const data = await ServiceData.find();
    res.send({status:"success", data:data.length});
  }
  catch(error){
    res.send({status: "error", message: error});
  }
});

//get number of customers
app.get('/getNumberOfCustomers', async (req, res) => {
  try{
    const data = await User.find({role: "Customer"});
    res.send({status:"success", data:data.length});
  }
  catch(error){
    res.send({status: "error", message: error});
  }
});

//get number of vendors
app.get('/getNumberOfVendors', async (req, res) => {
  try{
    const data = await User.find({role: "Vendor"});
    res.send({status:"success", data:data.length});
  }
  catch(error){
    res.send({status: "error", message: error});
  }
});


app.get('/getNumberOfManagers', async (req, res) => {
  try{
    const data = await ManagerData.find();
    res.send({status:"success", data:data.length});
  }
  catch(error){
    res.send({status: "error", message: error});
  }
});

//get number of bookings
app.get('/getNumberOfBookings', async (req, res) => {
  try{
    const data = await BookingData.find();
    res.send({status:"success", data:data.length});
  }
  catch(error){
    res.send({status: "error", message: error});
  }
});

//get number of pending bookings
app.get('/getNumberOfPendingBookings', async (req, res) => {
  try{
    const data = await BookingData.find({status: "Pending"});
    res.send({status:"success", data:data.length});
  }
  catch(error){
    res.send({status: "error", message: error});
  }
});

//get user phonenumber
app.post('/getUserPhoneNumber', async (req, res) => {
  const {token} = req.body;
  try{
    const user = jwt.verify(token, JWT_SECRET);
    const userEmail = user.email;
    const data = await User.find({email:userEmail});
    res.send({status:"success", data:data[0].phone});
  }
  catch(error){
    res.send({status: "error", message: error});
  }
});

//set phone number
app.post('/setUserPhoneNumber', async (req, res) => {
  const {token, phoneNumber} = req.body;
  try{
    const user = jwt.verify(token, JWT_SECRET);
    const userEmail = user.email;
    const data = await User.findOneAndUpdate({email:userEmail}, {phone:phoneNumber});
    res.send({status:"success", data:data});
  }
  catch(error){
    res.send({status: "error", message: error});
  }
});

//bookings
app.post('/bookings', async (req, res) => {
  const {token, venueID, serviceID, date, time} = req.body;
  try{
    const user = jwt.verify(token, JWT_SECRET);
    const userEmail = user.email;
    const newBooking = new BookingData({
      venueid:venueID,
      serviceid:serviceID,
      customerEmail:userEmail,
      date:date,
      time: time
    });
    newBooking.save().then((data)=>{
      res.send({status:"success", data:data});
    }
    )
  }
  catch(error){
    res.send({status: "error", message: error});
  }
}
);

//get bookings
app.get('/getBookings', async (req, res) => {
  try {
    const bookings = await BookingData.find();
    const bookingDataWithVenueAndService = [];
    for (const booking of bookings) {
      let venue, service, customer;
      if (booking.venueid) {
        venue = await VenueData.findById(booking.venueid);
      }
      if (booking.serviceid) {
        service = await ServiceData.findById(booking.serviceid);
      }
      if (booking.customerEmail) {
        customer = await User.findOne({ email: booking.customerEmail });
      }
      const data = {
        ...booking.toJSON(),
        venueName: venue ? venue.venueName : null,
        venueNumber: venue ? venue.contactInfo : null,
        venueEmail: venue ? venue.email : null,
        serviceName: service ? service.serviceName : null,
        serviceNumber: service ? service.contactInfo : null,
        serviceEmail: service ? service.email : null,
        customerName: customer ? customer.fname : null,
        customerNumber: customer ? customer.phone : null
      };
      bookingDataWithVenueAndService.push(data);
    }
    res.send({ status: "success", data: bookingDataWithVenueAndService });
  } catch (error) {
    res.status(500).send({ status: "error", message: error });
  }
});

//get specific user booking
app.post('/getSpecificUserBookings', async (req, res) => {
  const { token } = req.body;
  try {
    const user = jwt.verify(token, JWT_SECRET);
    const userEmail = user.email;
    const bookingDataWithVenueAndService = [];
    const bookings = await BookingData.find({ customerEmail: userEmail });
    for (const booking of bookings) {
      let venue, service, customer;
      if (booking.venueid) {
        venue = await VenueData.findById(booking.venueid);
      }
      if (booking.serviceid) {
        service = await ServiceData.findById(booking.serviceid);
      }
      if (booking.customerEmail) {
        customer = await User.findOne({ email: booking.customerEmail });
      }
      const data = {
        ...booking.toJSON(),
        venueName: venue ? venue.venueName : null,
        venueNumber: venue ? venue.contactInfo : null,
        venueEmail: venue ? venue.email : null,
        serviceName: service ? service.serviceName : null,
        serviceNumber: service ? service.contactInfo : null,
        serviceEmail: service ? service.email : null,
        customerName: customer ? customer.fname : null,
        customerNumber: customer ? customer.phone : null
      };
    
      bookingDataWithVenueAndService.push(data);
    }
    
    res.send({ status: "success", data: bookingDataWithVenueAndService });
  } catch (error) {
    console.log(error);
    res.send({ status: "error", message: error });
  }
});


//get pending bookings
app.get('/getPendingBookings', async (req, res) => {
  try{
    const data = await BookingData.find({status:"Pending"});
    res.send({status:"success", data:data});
  }
  catch(error){
    res.send({status: "error", message: error});
  }
}
);

//accept booking
app.post('/acceptBooking', async (req, res) => {
  const {token, id} = req.body;
  try{
    const user = jwt.verify(token, JWT_SECRET);
    const userEmail = user.email;
    User.findOne({email:userEmail}).then((data)=>{
      if(data.role == "Admin"){
        BookingData.findOneAndUpdate({_id:id}, {status:"Accepted"}).then((data)=>{
          res.send({status:"success", data:data});
        })
      }
      else{
        res.send({status:"error", message:"You are not an admin"});
      }
    })
  }
  catch(error){
    res.send({status: "error", message: error});
  }
});

//rejecting booking
app.post('/rejectBooking', async (req, res) => {
  const {token, id} = req.body;
  try{
    const user = jwt.verify(token, JWT_SECRET);
    const userEmail = user.email;
    User.findOne({email:userEmail}).then((data)=>{
      if(data.role == "Admin"){
        BookingData.findOneAndUpdate({_id:id}, {status:"Rejected"}).then((data)=>{
          res.send({status:"success", data:data});
        })
      }
      else{
        res.send({status:"error", message:"You are not an admin"});
      }
    })
  }
  catch(error){
    res.send({status: "error", message: error});
  }
});


//cancelling booking
app.post('/cancelBooking', async (req, res) => {
  const {token, id} = req.body;
  try {
    const user = jwt.verify(token, JWT_SECRET);
    const userEmail = user.email;
    const book = await BookingData.findById(id).exec();
    if(book.customerEmail == userEmail){
      BookingData.findOneAndUpdate({_id:id}, {status:"Cancelled"})
      .then((data)=>{
        res.send({status:"success", data:data});
      });
    }         
    else{
      res.send({status:"error", message:"You are not the owner of this booking"});
    }
  }
  catch(error){
    res.send({status: "error", message: error});
  }
});


//get top 4 pending bookings
app.get('/getTopBookings', async (req, res) => {
  try{
    const data = await BookingData.find({status:"Pending"}).limit(7);
    res.send({status:"success", data:data});
  }
  catch(error){
    res.send({status: "error", message: error});
  }
});


//add rating
app.post('/addRating', async (req, res) => {
  const { token, venueID, serviceID, rating } = req.body;
  try {
    const user = jwt.verify(token, JWT_SECRET);
    const userEmail = user.email;
    const filter = { productID: venueID || serviceID, customerEmail: userEmail };
    const existingRating = await RatingData.findOne(filter);
    if (existingRating) {
      // Update the existing rating
      await RatingData.updateOne(filter, { rating: rating });
      const productType = venueID ? 'venue' : 'service';
      const productID = venueID || serviceID;
      const ratings = await RatingData.find({ productID: productID });
      const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
      const avgRating = totalRating / ratings.length;
      if (productType === 'venue') {
        await VenueData.findByIdAndUpdate(productID, { avgRating: avgRating });
      } else {
        await ServiceData.findByIdAndUpdate(productID, { avgRating: avgRating });
      }
      res.send({ status: "success", data: existingRating });
    } else {
      // Create a new rating
      const productType = venueID ? 'venue' : 'service';
      const newRating = new RatingData({
        productID: venueID || serviceID,
        customerEmail: userEmail,
        rating: rating
      });
      newRating.save().then(async (data) => {
        const productID = venueID || serviceID;
        const ratings = await RatingData.find({ productID: productID });
        const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
        const avgRating = totalRating / ratings.length;
        if (productType === 'venue') {
          await VenueData.findByIdAndUpdate(productID, { avgRating: avgRating });
        } else {
          await ServiceData.findByIdAndUpdate(productID, { avgRating: avgRating });
        }
        res.send({ status: "success", data: data });
      });
    }
  } catch (error) {
    console.log(error);
    res.send({ status: "error", message: error });
  }
});

//add review
app.post('/addReview', async(req, res) =>{
  const { token, productID, reviewSubject, reviewDesc } = req.body;
  try{
    const user = jwt.verify(token, JWT_SECRET);
    customer = await User.findOne({ email: user.email });
    await ReviewData.create({
      fname: customer.fname,
      productID,
      reviewSubject,
      reviewDesc
    });
    res.send({status: "success", message: "Review Added Successfully."});
  }
  catch (error){
    console.log(error);
    res.send({status: "error", message: error});
  }
})

//get review
app.get('/getReview/:id', async (req, res) => {
  try {
    const data = await ReviewData.find({ productID: req.params.id });
    res.send({ status: 'success', data: data });
  } catch (error) {
    console.log(error)
    res.send({ status: 'error', message: error });
  }
});