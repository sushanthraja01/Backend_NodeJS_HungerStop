const jwt = require('jsonwebtoken')
const Vendor = require('../models/Vendor')
require('dotenv').config()

const verifyToken = async(req, res, next) => {
    const secretkey = process.env.JWT_SECRET;
    const token = req.headers.token;
    if(!token){
        return res.status(400).json("Token is required")
    }
    try {
        const decodded = jwt.verify(token,secretkey)
        const vendor = await Vendor.findById(decodded.vendorId)
        if(!vendor){
            return res.status(404).json("Vendor not Found")
        }
        req.vendorId = vendor._id;
        next();
    } catch (error) {
        console.log(error);
        return res.status(400).json(error)
    }
}

module.exports = verifyToken;