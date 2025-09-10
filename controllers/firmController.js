const Vendor = require('../models/Vendor')
const Product = require('../models/Product')
const Firm = require('../models/Firm')
const Pfirm = require('../models/Pfirm')
const multer = require('multer')
const nodemailer = require('nodemailer')
const cloudinary = require('cloudinary').v2
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
        user: "rajasaidathasushanth2006@gmail.com",
        pass: "jrqw mnii fhdj acki"  
    }
});


const reqaddfirm = async(req, res) => {
    try {
        const base = process.env.BASE_URL;
        const {firmname, category, area, region} = req.body
        const vendorId =  req.vendorId
        const vendor = await Vendor.findById(vendorId)
        if(!vendor){
            return res.status(400).json("Vendor not found")
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
        const savedfirm = await pfirm.save()
        docnames={}
        if (req.files && Object.keys(req.files).length > 0) {
            for (const field in req.files) {
                const filesArray = req.files[field];
                for (const file of filesArray) {
                    const safefirm = pfirm.firmname.replace(/\s+/g, "_");
                    const fn = `${vendor._id}_${safefirm}_${file.fieldname}`
                    const uploadResult = await utc(file.buffer, fn);
                    docnames[field] = uploadResult.public_id; 
                }
            }
            Object.assign(savedfirm, docnames);
        }
        await savedfirm.save();
        let mailOptions = {
        from: '"HungerSpot Bot"',
        to: "rajasaidathasushanth2006@gmail.com",
        subject: "A firm request from " + vendor.name,
        html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Firm Request</h2>
          <p>A new firm request has been submitted by <b>${vendor.name}</b>.</p>
          <br>

          <a href="${base}/firm/accept/${savedfirm._id}" 
             style="display:inline-block; background:green; color:white; padding:10px 20px; 
                    text-decoration:none; border-radius:5px; font-weight:bold;">
             ✅ Accept
          </a>

          <a href="${base}/firm/decline/${savedfirm._id}" 
             style="display:inline-block; background:red; color:white; padding:10px 20px; 
                    text-decoration:none; border-radius:5px; font-weight:bold; margin-left:10px;">
             ❌ Decline
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

    let info = await transporter.sendMail(mailOptions);
    return res.status(200).json({"details":"Firm request sent successfully", savedfirm, info})
    } catch (error) {
        console.log(error)
        return res.status(400).json(error)
    }
}

const delfrimbyid = async(req, res) => {
    try {
        const firmId = req.params.id
        const firm = await Firm.findById(firmId)
        const vid = firm.vendor[0]
        const vendor = await Vendor.findById(vid)
        const prods = await Product.find({_id: {$in:firm.product}})
        if(!firm || !vendor){
            return res.status(400).json("Firm not found or Vendor not set to firm")
        }
        const vname = vendor.username;
        const fname = firm.firmname;
        const pnames = prods.map(p => p.productname)
        await Product.deleteMany({_id:{$in:prods}})
        await Firm.findByIdAndDelete(firmId);
        await Vendor.updateOne(
            {_id: vid},
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
        const firmId = req.params.id
        const pfirm = await Pfirm.findById(firmId)
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
        await newfirm.save()
        vendor.firm.push(newfirm._id)
        await vendor.save()
        await Pfirm.findByIdAndDelete(firmId)
        return res.status(200).send(`<h1 align="center">Firm request accepted successfully</h1>`)
    } catch (error) {
        console.error(error)
        return res.status(400).jsend(`<h1 align="center">${error}</h1>`)
    }
}

const declinereq = async(req, res) => {
    try {
        const firmId = req.params.id
        const pfirm = await Pfirm.findById(firmId)
        if(!pfirm){
            if(await Firm.findById(firmId)){
                return res.status(400).json(`<h1 align = "center">Firm request already accepted</h1>`)
            }else{
                return res.status(400).json(`<h1 align = "center">Firm request not found</h1>`)
            }
        }
        const firmname = pfirm.firmname;
        const vendor = await Vendor.findById(pfirm.vendor)
        if(!vendor){
            return res.status(400).send(`<h1 align = "center">Vendor not found</h1>`)
        }
        for(const field of ["image","fssai","gst","shop_license","anual_income"]){
            if(pfirm[field]){
                await delfc(pfirm[field])
            }
        }
        await Pfirm.findByIdAndDelete(firmId);
        let mailoptions = {
            from: '"Hungerspot Bot"',
            to: vendor.email,
            subject: "A Response to the firm request "+firmname,
            html:`
                <div>
                    <p>Sorry your firm request gets cancelled.Try again with all correct documents hope next time the request will be accepted</p>
                    <p>Thank you for using Humger Spot</p>
                </div>
            `
        }
        await transporter.sendMail(mailoptions);
        return res.status(200).send(`<h1 align = "center">Request declined successfully</h1>`)
    } catch (error) {
        return res.status(400).send(`<h1 align = "center">${error}</h1>`)
    }
}

module.exports = { reqaddfirm, delfrimbyid, upload, acceptreq, declinereq }