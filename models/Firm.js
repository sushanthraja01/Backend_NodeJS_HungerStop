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
        type:[{type:String, enum:["veg","non-veg"]}], 
        required:true
    },
    region:{
        type:[{type:String, enum:["south-indian","north-india","chinese","bakery"]}], 
        required:true
    },
    offer:{
        type:String,    
    },
    image:{
        type:String,
    },
    vendor:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Vendor"
        }
    ],
    product:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Product"
        }
    ]
});

const Firm = mongoose.model("Firm",Firmschema);

module.exports = Firm;