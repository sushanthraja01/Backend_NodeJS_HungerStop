const Vendor = require('../models/Vendor')
const Product = require('../models/Product')
const Firm = require('../models/Firm')
const Pfirm = require('../models/Pfirm')
const multer = require('multer')
const nodemailer = require('nodemailer')
const mongoose = require('mongoose')
const cloudinary = require('cloudinary').v2
const crypto = require('crypto')
const bcrypt = require('bcrypt')
const path = require('path')
const fs = require('fs');
const e = require('express')
require('dotenv').config()

const storage = multer.memoryStorage();
const upload = multer({storage:storage})

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.api_key,
    api_secret: process.env.api_secret
})

const delfc = async(publicid) => {
    try {
        const resource = await cloudinary.api.resource(publicid);
        await cloudinary.uploader.destroy(resource.public_id, { resource_type: resource.resource_type });

    } catch (error) {
        console.error(error)
    }
}

const utc = (fileBuffer, fn, folder="hsfirm") => {
    const mfn = fn.replace(/\s+/g, "_");
    return new Promise((resolve,reject)=>{
        const stream = cloudinary.uploader.upload_stream(
            {folder,resource_type:"auto",public_id:mfn},
            (error,result)=>{if (error) return reject(error)
                return resolve(result)
            }
        )
        stream.end(fileBuffer)
    })
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.email_user,
        pass: process.env.email_pass  
    }
});

const reqaddfirm = async(req, res) => {
    try {
        const session = await mongoose.startSession();
        session.startTransaction();
        const base = process.env.BASE_URL;
        const {firmname, category, area, region} = req.body

        const vendorId =  req.vendorId
        const vendor = await Vendor.findById(vendorId)
        if(!vendor){
            return res.status(400).json("Vendor not found")
        }else if(vendor.role !== "mainvendor"){
            return res.status(400).json(`Only main vendor can add firm.But your role is ${vendor.role}.To add firm change your role`)
        }

        if(vendor.verified==="no"){
            return res.status(400).json("Your account is not verified.Verify your account first then request a  firm")
        }

        const checkfirm1 = await Pfirm.findOne({firmname:firmname})
        if(checkfirm1 && checkfirm1.vendor.toString() === vendorId.toString()){
            return res.status(400).json("Request is in pending")
        }else if(checkfirm1){
            return res.status(400).json("Already firm name exists in pending requests")
        }
        const checkfirm = await Firm.findOne({firmname:firmname})
        if(checkfirm){
            return res.status(400).json("Already firm name exists")
        }

        const pfirm = new Pfirm({
            firmname,
            category,
            area,
            region,
            vendor: vendorId,
            image:undefined,
            fssai:undefined,
            gst:undefined,
            shop_license:undefined,
            anual_income:undefined
        })
        const savedfirm = await pfirm.save({session});
        
        let uf;
        const uploadpromises = []
        if (req.files && Object.keys(req.files).length > 0) {
            for (const field in req.files) {
                for (const file of req.files[field]) {
                    const safefirm = pfirm.firmname.replace(/\s+/g, "_");
                    const fn = `${vendor._id}_${safefirm}_${file.fieldname}`
                    uploadpromises.push(
                        utc(file.buffer, fn).then((r)=>({
                            field,
                            publicid : r.public_id
                        }))
                    )
                }
            }
        }

        try {
            uf = await Promise.all(uploadpromises);
        } catch (error) {
            for(const file of uf || []){
                await delfc(file.publicid)
            }
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                error: "Failed to upload documents to Cloudinary",
            });
        }

        let docnames={}
        for(const doc of uf){
            docnames[doc.field] = doc.publicid
        }
        Object.assign(savedfirm,docnames)
        await savedfirm.save({session})

        let mailOptions = {
        from: `"HungerStop Bot" <${process.env.email_user}>`,
        to: "rajasaidathasushanth2006@gmail.com",
        subject: `A firm request from ${vendor.name}`,
        html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Firm Request</h2>
          <p>A new firm request has been submitted by <b>${vendor.name}</b>.</p>
          <br>

          <a href="${base}/firm/accept/${savedfirm._id}" 
             style="display:inline-block; background:green; color:white; padding:10px 20px; 
                    text-decoration:none; border-radius:5px; font-weight:bold;">
              Accept
          </a>

          <a href="${base}/firm/decline/${savedfirm._id}" 
             style="display:inline-block; background:red; color:white; padding:10px 20px; 
                    text-decoration:none; border-radius:5px; font-weight:bold; margin-left:10px;">
              Decline
          </a>

          <hr>
          <small>Sent by Sushanth's Node.js app</small>
          </div>
        `,

          attachments:
            req.files?Object.values(req.files).flat().map(file => ({
              filename: file.originalname,
              content: file.buffer
            })):[],
        };

        try {
            let info = await transporter.sendMail(mailOptions);
            await session.commitTransaction();
            session.endSession();
            return res.status(200).json({"details":"Firm request sent successfully", savedfirm, info})
        } catch (error) {
            await session.abortTransaction()
            session.endSession()
            for(const doc of uf){
                await delfc(doc.publicid)
            }
            return res.status(400).json("Error Sending an email")
        }
    } catch (error) {
        console.log(error)
        return res.status(400).json(error)
    }
}

const delfrimbyid = async(req, res) => {
    try {
        const firmId = req.params.id
        const firm = await Firm.findById(firmId)
        const vendor = await Vendor.findById(firm.vendor)
        const prods = await Product.find({_id: {$in:firm.product}})
        if(!firm || !vendor){
            return res.status(400).json("Firm not found or Vendor not set to firm")
        }
        const vname = vendor.username;
        const fname = firm.firmname;
        const pnames = prods.map(p => p.productname)
        await Product.deleteMany({_id:{$in:prods}})
        await Firm.findByIdAndDelete(firmId);
        await Vendor.deleteMany({$or:[{email: fname},{username: fname}]})
        await Vendor.updateOne(
            {_id: firm.vendor},
            {$pull: {firm:firmId}}
        )
        res.status(200).json({"details":`Firm ${fname} is deleted successfully by the vendor ${vname} and also all products ${pnames}`})
    } catch (error) {
        console.log(error)
        return res.status(400).json(error)
    }
    
}

const acceptreq = async(req, res) => {
    try {
        const firmId = req.params.id;
        const pfirm = await Pfirm.findById(firmId)
        const session = await mongoose.startSession();
        session.startTransaction();
        if(!pfirm){
            if(await Firm.findById(firmId)){
                return res.status(400).send(`<h1 align="center">Firm request already accepted</h1>`)
            }else{
                return res.status(400).send(`<h1 align="center">Firm request not found or already declined</h1>`)
            }
        }
        const vendorId = pfirm.vendor.toString()
        const vendor = await Vendor.findById(vendorId)
        const newfirm = new Firm(pfirm.toObject());
        const savedfirm = await newfirm.save({session})
        vendor.firm.push(newfirm._id)
        await vendor.save({session})
        await Pfirm.findByIdAndDelete(firmId,{session})
        let gpass,hpass;
        let nsv
        try {
            gpass = crypto.randomBytes(8).toString("hex")
            hpass = await bcrypt.hash(gpass,10)
            console.log(vendor.phoneno)
            const nv = new Vendor({
                name:vendor.name,
                username:savedfirm.firmname,
                email:savedfirm.firmname,
                phoneno:vendor.phoneno,
                password:hpass,
                role:"vendor",
                vendor:vendor._id,
                token:""
            });
            nsv = await nv.save({session});
        } catch (error) {
            await session.abortTransaction();
            await session.endSession();
            return res.status(400).json(error)
        }
        try {
            let mailoptions = {
                from: `"HungerStop Bot" <${process.env.email_user}>`,
                to:vendor.email,
                subject: `Response to requested firm ${savedfirm.firmname}`,
                html: `
                    <div>
                        <p>Congratulations! Your firm request for <b>${savedfirm.firmname}</b> has been accepted successfully.</p>
                        <p>Since your firm request has been approved, we are providing you with credentials to log in and perform actions such as adding and removing items and handling requests.</p>
                        <p>However, the credentials below do not grant access to certain major features, such as removing the firm or changing opening and closing times. They only allow limited access, which makes them safe to share with your firm manager.</p>
                        <p>Whenever you log in to HungerStop Partnership with your owner credentials, you will have full access to all the firms you own.</p>
                        <p><b>Credentials:</b></p>
                        <table style="background-color: lightgreen; padding: 10px;">
                            <tr>
                                <td>
                                    Username: ${nsv.email}<br />
                                    Password: ${gpass}
                                </td>
                            </tr>
                        </table>
                        <p>Once you log in with the above account, you can change the password at any time.</p>
                        <p>Thank you for using HungerStop!</p>
                        <br />
                        <p>For any queries, simply reply to this email.</p>
                    </div>
                `
            }
            await transporter.sendMail(mailoptions);
        } catch (error) {
            await session.abortTransaction();
            await session.endSession();
            return res.status(400).json(error)
        }
        await session.commitTransaction();
        await session.endSession()
        return res.status(200).send(`
            <h1 align="center">Firm request accepted successfully</h1>
            <hr />
            <p>A firm request from ${savedfirm.firmname} is accepted succesfully.</p>
            <p>A vendor ${vendor.name} is requested this firm.</p>
            <p>username : ${vendor.username}</p>
            <p>email : ${vendor.email}</p>
            <p>phone no : ${vendor.phoneno}</p>
            `);
    } catch (error) {
        console.error(error)
        return res.status(400).send(`<h1 align="center">${error}</h1>`)
    }
}

const declinereq = async(req, res) => {
    try {
        const firmId = req.params.id
        const pfirm = await Pfirm.findById(firmId)
        if(!pfirm){
            if(await Firm.findById(firmId)){
                return res.status(400).send(`<h1 align = "center">Firm request already accepted</h1>`)
            }else{
                return res.status(400).send(`<h1 align = "center">Firm request not found</h1>`)
            }
        }
        const firmname = pfirm.firmname;
        const vendor = await Vendor.findById(pfirm.vendor)
        if(!vendor){
            return res.status(400).send(`<h1 align = "center">Vendor not found</h1>`)
        }
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            await Pfirm.findByIdAndDelete(firmId,{session});
        } catch (error) {
            await session.abortTransaction();
            await session.endSession();
            return res.status(400).json(error)
        }
        try {
            for(const field of ["image","fssai","gst","shop_license","anual_income"]){
                if(pfirm[field]){
                    await delfc(pfirm[field])
                }
            }
        } catch (error) {
            await session.abortTransaction();
            await session.endSession();
            return res.status(400).json(error)
        }
        try {
            let mailoptions = {
                from: `"HungerStop Bot" <${process.env.email_user}>`,
                to: vendor.email,
                subject: "A Response to the firm request "+firmname,
                html:`
                    <div>
                        <p>Sorry your firm request gets cancelled.Try again with all correct documents hope next time the request will be accepted</p>
                        <p>Thank you for using Hunger Stop</p>
                    </div>
                `
            }
            await transporter.sendMail(mailoptions);
        } catch (error) {
            await session.abortTransaction();
            await session.endSession();
            return res.status(400).json(error)
        }
        await session.commitTransaction();
            await session.endSession();
        return res.status(200).send(`<h1 align = "center">Request declined successfully</h1>`)
    } catch (error) {
        return res.status(400).send(`<h1 align = "center">${error}</h1>`)
    }
}

const getallhotels = async(req,res) =>{
    try {
        const h = await Firm.find();
        if(h.length===0){
            return res.status(200).json("No Hotels Available")
        }
        return res.status(200).json(h)
    } catch (error) {
        return res.status(400).json("Internal Server Error")
    }
}

module.exports = { reqaddfirm, delfrimbyid, upload, acceptreq, declinereq, getallhotels }