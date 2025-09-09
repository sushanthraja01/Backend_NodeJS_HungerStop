const Vendor = require('../models/Vendor')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

require('dotenv').config();

const vendorRegistration = async(req, res)=>{
    const {role} = req.body;
    const {name, username, email, phoneno, password} = req.body;
    try{
        const checkemail = await Vendor.findOne({email});
        const checkusername = await Vendor.findOne({username});
        if(checkemail){
            return res.status(400).json("Email already exists");
        }else if(checkusername){
            return res.status(400).json("Username already exists");
        }else{
            const hashedpass = await bcrypt.hash(password, 10);
            const newVendor = new Vendor({
                name,
                username,
                email,
                phoneno,
                password: hashedpass,
                role
            });
            await newVendor.save();
        }
        return res.status(200).json("Registered Successfully");
    }catch(error){
        console.log(error);
        return res.status(400).json("An error occured");
    }
    
}



const vendorLogin = async(req, res) => {
    const {user,password} = req.body;
    try{
        const vendor = await Vendor.findOne({$or:[{username:user},{email:user}]});
        if(!vendor){
            res.status(400).json("Invalid Email or Username");
        }else if(!(await bcrypt.compare(password,vendor.password))){
            res.status(400).json("Wrong Password")
        }else{
            const secretkey = process.env.JWT_SECRET;
            const token = jwt.sign({ vendorId: vendor._id },secretkey);
            const id = vendor._id
            console.log(vendor.username)
            res.status(200).json({success:"Login Successful",token,id});
        }
    }catch(error){
        console.log(error);
        return res.status(400).json("Internal Server error")
    }
}


const crole = async(req,res) => {
    try {
        const {user} = req.body;
        const vendor = await Vendor.findOne({ $or:[{username:user},{email:user}] })
        if(!vendor){
            return res.status(400).json("Invalid Email or Username")
        }
        const prole = vendor.role
        console.log(prole)
        if(prole[0]==="customer"){
            await Vendor.updateOne({email:vendor.email},{$pull:{role:"customer"}})
            await Vendor.updateOne({email:vendor.email},{$push:{role:"mainvendor"}})
            return res.status(200).json("Your role changed successfully from customer to Vendor")
        }else if(prole[0]==="vendor"){
            return res.status(400).json("A Vendor cannot convert from vendor to Main Vendor")
        }else{
            return res.status(200).json("You are already an main vendor")
        }
    } catch (error) {
        console.error(error)
        return res.status(400).json("An error occured")
    }
}




const cpass = async(req, res) => {
    const vid = req.params.id;
    const v = await Vendor.findById(vid);
    if(!v){
        return res.status(400).json("Vendor not found");
    }
    const {cpass,npass,cnpass} = req.body;
    console.log(cpass,npass,cnpass,v.password)
    if(npass!=cnpass){
        res.status(400).json("Password and conform passworm should be same");
    }
    if(!(await bcrypt.compare(cpass,v.password))){
        return res.status(400).json("Wrong Password");
    }
    const hnp = await bcrypt.hash(npass,10);
    v.password = hnp;
    await v.save();
    return res.status(200).json("Password changed successfully")
}



const getallfirms = async(req, res) => {
    try {
        const vendors = await Vendor.find().populate('firm');
        res.json({ vendors })
    } catch (error) {
        console.error(error)
        return res.status(400).json("Internal Server error")
    }
}


const getsinglevendor = async(req, res) => {
    try {
        const vendorId = req.params.id
        const vendor = await Vendor.findById(vendorId).populate('firm')
        if(!vendor){
            return res.status(400).json("Vendor not found")
        }
        res.status(200).json(vendor)
    } catch (error) {
        console.error(error)
        return res.status(400).json("Internal Server error")
    }
}


module.exports = {vendorRegistration,vendorLogin,getallfirms,getsinglevendor,cpass,crole}