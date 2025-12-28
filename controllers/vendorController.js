const Vendor = require('../models/Vendor')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const nodemailer = require('nodemailer')
const jwt = require('jsonwebtoken')

require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth:{
        user: process.env.email_user,
        pass: process.env.email_pass
    }
});

const vendorRegistration = async(req, res)=>{
    const {name, username, email, phoneno, password, verified,role } = req.body;

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
                role,
                verified,
                token:"-"
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
        }else if(vendor.token !== "-"){
            return res.status(200).json({mssg:"Already have an exsisting session",role:vendor.role})
        }else{
            const secretkey = process.env.JWT_SECRET;
            const token = jwt.sign({ vendorId: vendor._id },secretkey);
            const id = vendor._id
            vendor.token = token;
            await vendor.save()
            console.log(vendor.username)
            return res.status(200).json({mssg:"Login Successful",token,id,role:vendor.role});
        }
    }catch(error){
        console.log(error);
        return res.status(400).json("Internal Server error")
    }
}

const crole = async(req,res) => {
    try {
        const {username,email, wrole} = req.body;
        const vendor = await Vendor.findOne({$and:[{username:username},{email:email}]})
        
        if(!vendor){
            return res.status(400).json("Invalid Email or Username")
        }
        const prole = vendor.role
        if(prole===wrole){
            return res.status(400).json(`You are already a ${prole}`)
        }
        if(wrole==="vendor"){
            return res.status(400).json("No one can convert to vendor")
        }
        if(prole==="vendor"){
            return res.status(400).json("A Vendor cannot convert his role.")
        }else if(prole==="customer"){
            await Vendor.updateOne({email:vendor.email},{role:"mainvendor"})
            return res.status(200).json("Your role changed successfully from customer to main vendor")
        }else if(prole==="mainvendor"){
            if(vendor.firm.length>0){
                return res.status(400).json("To convert from main vendor to customer you have to delete all firms");
            }
            await Vendor.updateOne({email:vendor.email},{role:"customer"})
            return res.status(200).json("Your role changed successfully from main vendor to custeomer")
        }
    } catch (error) {
        console.error(error)
        return res.status(400).json("An error occured")
    }
}

const cpass = async(req, res) => {
    const vid = req.vendorId;
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

const reqotp = async(req,res) => {
    try {
        const vid = req.vendorId;
        const vendor = await Vendor.findById(vid);

        if(!vendor){
            return res.status(400).json("Vendor not found")
        }

        if(vendor.verified==="yes"){
            return res.status(400).json("You Account is already Verified")
        }

        const otp = crypto.randomInt(0,Math.pow(10,6)).toString();
        let mailoptions = {
            from: `"Hungerstop Bot" <${process.env.email_user}>`,
            to: vendor.email,
            subject: `OTP to verify your Accoeunt`,
            html:`
                <div>
                    <p>Otp : ${otp}</p>
                    <p>Dont share this otp to anyone</p>
                    <hr >
                    <small>from hungerspot bot</small>
                </div>
            `
        }        
        await transporter.sendMail(mailoptions)
        vendor.otp = otp
        await vendor.save()
        return res.status(200).json("otp sent successfully")
    } catch (error) {
        console.error(error)
        return res.status(400).json(error)
    }
}

const validateotp = async(req,res) => {
    try {
        const vid = req.vendorId
        const {cotp} = req.body;
        const vendor = await Vendor.findById(vid);

        if(!vendor){
            return res.status(400).json("Vendor not found")
        }

        if(vendor.otp===cotp){
            vendor.otp=""
            vendor.verified="yes"
            await vendor.save();
            return res.status(200).json("Verified Successfully")
        }else if(vendor.otp === ""){
            return res.status(400).json("Otp not requested")        
        }else{
            return res.status(400).json("Incorrect OTP")
        }

    } catch (error) {
        console.error(error)
        return res.status(400).json(error)
    }
}

const forgotpassword = async(req, res) => {
    try {
    const {username,email} = req.body
    const vendor = await Vendor.findOne({$and:[{username:username},{email:email}]})
    
    if(!vendor){
        return res.status(400).json("Vendor not found")
    }

    const genpass = await crypto.randomBytes(8).toString('hex')
    const hashedpass = await bcrypt.hash(genpass,10)

    vendor.password = hashedpass
    await vendor.save();

    let mailoptions = {
        from: `"HungerStop Bot" <${process.env.email_user}>`,
        to: vendor.email,
        subject:`New Password for your Account`,
        html:`
            <div>
                <p>Dear <b>${vendor.name}</b>,</p>
                <p>New Credentials:</p>
                <table style="background-color: lightgreen; padding: 10px; border:1px solid black; border-radius:2px;">
                    <tr>
                        <td>
                            Username: ${vendor.username}<br />
                            Password: ${genpass}
                        </td>
                    </tr>
                </table>
                <p>You can login to your account and change password if you want</p>
                <hr>
                <p>Thank you for using - HungerStop</p>
                <small>Hungerspot Bot</small>
                <p>${vendor.name}</p>
            </div>
        `
    }

    await transporter.sendMail(mailoptions)
    return res.status(200).json("New password sent to mail")

    } catch (error) {
        console.error(error)
        return res.status(400).json("Internal server error")
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

const hsl = async(req,res) => {
    const {user,password} = req.body;
    try{
        const vendor = await Vendor.findOne({$or:[{username:user},{email:user}]});
        if(!vendor){
            return res.status(400).json("Invalid Email or Username");
        }else if(!(await bcrypt.compare(password,vendor.password))){
            return res.status(400).json("Wrong Password")
        }else{
            const secretkey = process.env.JWT_SECRET;
            const token = jwt.sign({ vendorId: vendor._id },secretkey);
            const id = vendor._id
            vendor.token = token;
            await vendor.save()
            return res.status(200).json({mssg:"Login Successful",token,id});
        }
    }catch(error){
        console.log(error);
        return res.status(400).json("Internal Server error")
    }
}

const logout = async(req,res) => {
    try {
        const id = req.vendorId;
        const vendor = await Vendor.findById(id);
        vendor.token = "-"
        await vendor.save()
        return res.status(200).json("Logged out successfully")
    } catch (error) {
        console.error(error)
    }
}

const vt = async(req,res) => {
    if(req.valid){
        const vendor = await Vendor.findById(req.vendorId)
        if(vendor.profile){
            return res.status(200).json({mssg:"success",profile:vendor.profile})
        }else{
            return res.status(200).json({mssg:"success",profile:"v1766404501/0c6211a9-4ef0-4ee1-9ef4-b461a4faccda"})
        }
        
    }else{
        return res.status(400).json("Fail")
    }
}

module.exports = {vendorRegistration,vendorLogin,getallfirms,getsinglevendor,cpass,crole,reqotp,validateotp,forgotpassword,logout,hsl,vt}