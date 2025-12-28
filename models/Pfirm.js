const mongoose = require('mongoose');
const schema = mongoose.Schema({
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
    },
    fssai:{
        type:String,
    },
    gst:{
        type:String,
    },
    shop_license:{
        type:String,
    },
    anual_income:{
        type:String
    }
})

const model = mongoose.model("Pfirm",schema);

module.exports = model;