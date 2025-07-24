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
        type:[{type:String,enum:["Veg","Non-Veg"]}],
        required:true
    },
    image:{
        type:String
    },
    bestseller:{
        type:[{type:String,enum:["yes","no"]}],
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