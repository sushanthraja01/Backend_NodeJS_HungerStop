const Product = require('../models/Product')
const Firm = require('../models/Firm')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });



const addproduct = async(req, res) => {

    try {
        const {productname,price,category,bestseller,description} = req.body


        const firmId = req.params.id
        const firm = await Firm.findById(firmId)
        if(!firm){
            return res.status(400).json("Firm not found")
        }

       const image = req.file ? req.file.filename : undefined;


        const product = new Product({
            productname,price,category,image,bestseller,description,firm: firmId
        })

        const savedproduct = await product.save();
        
        firm.product.push(savedproduct._id)

        await firm.save()
        
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

const delprodbyid = async(req, res) => {
    try {
        const id = req.params.productId;
        const prod = await Product.findById(id);
        const firmId = prod.firm[0];
        const firm = await Firm.findById(firmId)
        const firmname = firm.firmname
        if(!prod || !firm){
            return res.status(400).json("Product not found or not attached top any firm")
        }
        await Firm.updateOne(
            {_id:firmId},
            {$pull:{product:id}}
        )
        const delprod = await Product.findByIdAndDelete(id)
        res.status(200).json({"mssg": `${delprod.productname} is successfully deleted from firm: ${firmname}`})
    } catch (error) {
        console.error(error)
        return res.status(404).json("Internal Server error")
    }
}



module.exports = {addproduct:[upload.single('image'),addproduct],getproductbyfirm,delprodbyid}