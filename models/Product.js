const mongoose = require('mongoose')

const productschema = mongoose.Schema({
    productname:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    category:{
        type:String,
        enum:['veg','nonveg'],
        required:true
    },
    image:{
        type:String,
        required:true
    },
    itemtype:{
        type:String,
        enum:["starters","drinks","tiffins","meals","dinnner"],
        required:true
    },
    quantity:{
        type:Number,
    },
    region:{
        type:[{type:String, enum:["south-indian","north-india","chinese","bakery"]}], 
        required:true
    },
    firm:
    {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Firm"
    }
})

const Product = mongoose.model('Product',productschema)

module.exports = Product