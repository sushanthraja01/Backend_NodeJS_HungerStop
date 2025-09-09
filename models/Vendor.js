const mongoose = require('mongoose')

const Vendorschema = new mongoose.Schema({
    name:{
        type:String,
        required:function(){return this.role!=="vendor"}
    },
    username:{
        type:String,
        unique:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    phoneno:{
        type:Number,
        unique:true,
        required:function(){return this.role!=="vendor"}
    },
    password:{
        type:String,        
        required:true
    },
    role: {
        type: String,
        enum: ["customer", "mainvendor", "vendor"],
        required: true
    },
    firm:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Firm"
        }
    ]
});

const Vendor = mongoose.model('Vendor',Vendorschema);
module.exports = Vendor;