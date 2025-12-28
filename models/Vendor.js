const mongoose = require('mongoose')

const Vendorschema = new mongoose.Schema({
    name:{
        type:String,
    },
    email:{
        type:String,
        required:true,
    },
    phoneno: {
      type: Number,
    //   validate: {
    //     validator: function(v) {
    //       return this.role !== "vendor" ? v != null : true;
    //     },
    //     message: "Phone number is required for non-vendor roles"
    //   }
    },
    password:{
        type:String
    },
    verified:{
        type:String,
        enum:["yes","no"],
        required:function(){return this.role!=="vendor"}
    },
    role: {
        type: String,
        enum: ["customer", "mainvendor", "vendor"],
        required: true
    },
    otp:{
        type:String
    },
    firm:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Firm"
        }
    ],
    vendor:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vendor",
        required:function(){
            return this.role==="vendor"
        }
    },
    token:{
        type:String,
        // required:true
    },
    profile:{
        type:String
    }
});

const Vendor = mongoose.model('Vendor',Vendorschema);
module.exports = Vendor;