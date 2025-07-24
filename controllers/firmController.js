const Vendor = require('../models/Vendor')
const Product = require('../models/Product')
const Firm = require('../models/Firm')
const multer = require('multer')
const path = require('path')



const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/'); 
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

const addfirm = async(req, res) => {
    try {
        const {firmname, category, area, region, offer} = req.body
        const image = req.file ? req.file.filename : undefined;
        const vendorId =  req.vendorId
        const vendor = await Vendor.findById(vendorId)
        if(!vendor){
            return res.status(400).json("Vendor not found")
        }
        const checkfirm = await Firm.findOne({firmname})
        
        const firm = new Firm({
            firmname,
            category,
            area,
            region,
            offer,
            image,
            vendor: vendorId
        })
        const savedfirm = await firm.save()
        vendor.firm.push(savedfirm._id);
        await vendor.save();
        return res.status(200).json({mssg:"Firm added Succesfully",firmname})
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



module.exports = { addfirm: [upload.single('image'), addfirm], delfrimbyid}