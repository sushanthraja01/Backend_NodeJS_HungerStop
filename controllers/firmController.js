const Vendor = require('../models/Vendor')
const Product = require('../models/Product')
const Firm = require('../models/Firm')
const Pfirm = require('../models/Pfirm')
const multer = require('multer')
const nodemailer = require('nodemailer')
const path = require('path')
const fs = require('fs');
const e = require('express')
require('dotenv').config()

const storage = multer.memoryStorage();
const upload = multer({storage:storage})

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
        const docnames = {};
        if(req.files && Object.keys(req.files).length > 0){
            const udir = path.join(__dirname,"..","samuploads");
            if(!fs.existsSync(udir)){
                fs.mkdirSync(udir);
            }
            for(const field in req.files){
                const filesArray = req.files[field];
                for(const file of filesArray){
                    const filename = `${vendorId}_${file.originalname}`;
                    const filePath = path.join(udir, filename);
                    fs.writeFileSync(filePath, file.buffer);
                    docnames[field] = filename;
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
          <br>
        </div>
        <br /><br />
        <a href="${base}/firm/accept/${savedfirm._id}" 
             style="background:green;color:white;padding:10px 15px;text-decoration:none;border-radius:5px;">
             Accept
          </a>
          <a href="${base}/firm/decline/${savedfirm._id}" 
             style="background:red;color:white;padding:10px 15px;text-decoration:none;border-radius:5px;margin-left:10px;">
             Decline
          </a><hr>
          <small>Sent by Sushanth's Node.js app</small>
      `,
      attachments:
        Object.values(req.files).flat().map(file => ({
          filename: file.originalname,
          content: file.buffer
        })),
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
                return res.status(400).json(`<h1>Firm request already accepted</h1>`)
            }else{
                return res.status(400).json(`<h1>Firm request not found</h1>`)
            }
        }
        const vendorId = pfirm.vendor.toString()
        const vendor = await Vendor.findById(vendorId)
        const newfirm = new Firm(pfirm.toObject());
        await newfirm.save()
        const newpath = path.join(__dirname,"..","uploads");
        if(!fs.existsSync(newpath)){
            fs.mkdirSync(newpath);
        }
        for(const field of ["image","fssai","gst","shop_license","anual_income"]){
                if(pfirm[field]!==undefined){
                    const oldfile = path.join(__dirname,"..","samuploads",pfirm[field]);
                    const newname = `${vendorId}_${newfirm._id}_${pfirm[field]}`;
                    fs.writeFileSync(path.join(newpath,newname),fs.readFileSync(oldfile));
                    fs.unlinkSync(oldfile);
                    newfirm[field] = newname;
                }
            }
        await newfirm.save()
        vendor.firm.push(newfirm._id)
        await vendor.save()
        await Pfirm.findByIdAndDelete(firmId)
        return res.status(200).json(`<h1>Firm request accepted successfully</h1>`)
    } catch (error) {
        console.error(error)
        return res.status(400).json(`<h1>${error}</h1>`)
    }
}

const declinereq = async(req, res) => {
}

module.exports = { reqaddfirm, delfrimbyid, upload, acceptreq, declinereq }