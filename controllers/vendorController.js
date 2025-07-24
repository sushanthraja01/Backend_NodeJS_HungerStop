const Vendor = require('../models/Vendor')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

require('dotenv').config();

const vendorRegistration = async(req, res)=>{
    const {username, email, password} = req.body;

    try{
        const checkemail = await Vendor.findOne({email});
        if(checkemail){
            return res.status(400).json("Email already exists");
        }else{
            const hashedpass = await bcrypt.hash(password, 10);
            const newVendor = new Vendor({
                username,
                email,
                password: hashedpass
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
    const {username,password} = req.body;
    try{
        const vendor = await Vendor.findOne({username});

        if(!vendor || !(await bcrypt.compare(password,vendor.password))){
            res.status(400).json({error:"Invalid Username or Password"});
        }else{
            const secretkey = process.env.JWT_SECRET;
            const token = jwt.sign({ vendorId: vendor._id },process.env.JWT_SECRET,{ expiresIn: "1h" });

            res.status(200).json({success:"Login Successful",token});
        }
    }catch(error){
        console.log(error);
        return res.status(400).json({mssg:"Internal Server error"})
    }
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


module.exports = {vendorRegistration,vendorLogin,getallfirms,getsinglevendor}