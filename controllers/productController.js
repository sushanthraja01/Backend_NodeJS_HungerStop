const Product = require('../models/Product')
const Firm = require('../models/Firm')
const multer = require('multer')
const cloudinary = require('cloudinary').v2
const mongoose = require('mongoose')
const crypto = require('crypto')
const path = require('path')
const fs = require('fs')
require('dotenv').config()

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

cloudinary.config({
    cloud_name : process.env.cloud_name,
    api_key : process.env.api_key,
    api_secret : process.env.api_secret
})

const utc = (fileBuffer,fn,folder="hsprod") => {
    const mfn = fn.replace(/\s+/g,"_")
    return new Promise((resolve,reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {folder,resource_type:"auto",public_id:mfn},
            (error,result) => {
                if(error) return reject(error)
                return resolve(result)
            }
        )
        stream.end(fileBuffer);
    })
}

const delfc = async(fn) => {
    try {
        const resource = await cloudinary.api.resource(fn)
        await cloudinary.uploader.destroy(resource.public_id,{resource_type:resource.resource_type})
    } catch (error) {
        console.error(error)
    }
}

const addproduct = async(req, res) => {
    try {
        const session = await mongoose.startSession();
        session.startTransaction();

        const {productname,price,category,bestseller,description,quantity,itemtype} = req.body

        const firmId = req.params.id
        const firm = await Firm.findById(firmId).session(session)
        if(!firm){
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json("Firm not found")
        }

        let uploadresult = ""

        if(req.file){
            try {
                const fn = `${firm._id}_${crypto.randomBytes(6).toString('hex')}`
                const uploaded = await utc(req.file.buffer,fn)
                uploadresult = uploaded.public_id
            } catch (error) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json(error)
            }
        }

        try {
            const product = new Product({
                productname,price,category,image:uploadresult,bestseller,description,firm: firmId,quantity,itemtype
            })

            const savedproduct = await product.save({session});
            firm.product.push(savedproduct._id)
            await firm.save({session})
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            await delfc(uploadresult)
            return res.status(400).json(error)
        }

        await session.commitTransaction();
        session.endSession();
        
        res.status(200).json("Product added Successfully")
    } catch (error) {
        console.error(error)
        return res.status(404).json("Internal Server error")
    }
    
}


const getproductbyfirm = async(req, res) => {
    try {
        const firmId = req.params.firmId
        const firm = await Firm.findById(firmId)
        if(!firm){
            return res.status(400).json("Firm not found")
        }
        const firmname = firm.firmname
        const products = await Product.find({firm: firm._id})
        if(products.length == 0){
            res.status(200).json("No products")
        }
        return res.status(200).json(products)
    } catch (error) {
        console.error(error)
        return res.status(404).json("Internal server error")
    }

}

const getallprods = async(req,res) => {
    try {
        const prods = await Product.find().populate("firm","firmname area")
        if(prods.length==0){
            return res.status(200).json("No Products")
        }
        return res.status(200).json(prods)
    } catch (error) {
        console.log(error)
        return res.status(400).json("Internal server error")
    }
}

const delprodbyid = async(req, res) => {
    try {
        const id = req.params.productId;
        const prod = await Product.findById(id);
        const firmId = prod.firm;
        const firm = await Firm.findById(firmId)
        const firmname = firm.firmname
        if(!prod || !firm){
            return res.status(400).json("Product not found or not attached top any firm")
        }
        await Firm.updateOne(
            {_id:firmId},
            {$pull:{product:id}}
        )
        delfc(prod.image)
        const delprod = await Product.findByIdAndDelete(id)
        res.status(200).json({"mssg": `${delprod.productname} is successfully deleted from firm: ${firmname}`})
    } catch (error) {
        console.error(error)
        return res.status(404).json("Internal Server error")
    }
}



module.exports = {addproduct,upload,getproductbyfirm,delprodbyid,getallprods}