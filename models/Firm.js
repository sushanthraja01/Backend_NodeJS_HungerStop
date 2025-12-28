const mongoose = require('mongoose')

const Firmschema = mongoose.Schema({
    firmname:{
        type:String,
        required:true,
        unique:true
    },
    area:{
        type:String,
        required:true
    },
    category:{
        type:String,
        enum:["veg","non-veg"], 
        required:true
    },
    vendor:
    {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Vendor"
    },
    product:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Product"
        }
    ],
    image:{
        type:String,
        required:true
    },
    fssai:{
        type:String,
        required:true
    },
    gst:{
        type:String,
        required:true
    },
    shop_license:{
        type:String,
        required:true
    },
    anual_income:{
        type:String
    }
});

const Firm = mongoose.model("Firm",Firmschema);

module.exports = Firm;