const mongoose = require('mongoose')

const productschema = mongoose.Schema({
    productname:{
        type:String,
        required:true
    },
    price:{
        type:String,
        required:true
    },
    category:{
        type:[{type:String,enum:["veg","non-veg"]}],
        required:true
    },
    image:{
        type:String
    },
    bestseller:{
        type:Boolean,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    firm:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Firm"
        }
    ]
})

const Product = mongoose.model('Product',productschema)

module.exports = Product