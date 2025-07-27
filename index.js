require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const VenderRouter = require('./routes/VendorRouter')
const FirmRouter = require('./routes/FirmRouter')
const ProductRouter = require('./routes/ProductRouter')
const app = express();
const cors = require('cors')
const path = require('path')

app.use(express.json());
app.use((cors()))
app.use(express.urlencoded({extended:true}));

app.use((req, res, next)=>{
    console.log(req.method, req.path)
    next()
})

app.use("/vendor",VenderRouter);
app.use("/firm",FirmRouter);
app.use("/product",ProductRouter);
app.use("/uploads",express.static('uploads'))
app.use("/",(req, res)=>{
    res.send("<h1 align='center'>Welcome to HungerStop</h1>")
})


mongoose.connect(process.env.MONGO_URI)
.then(()=>{
    app.listen(process.env.PORT,()=>{
        console.log(`Server started and Listening at Port ${process.env.PORT}`)    
        console.log("Connected to database")
    })
})
.catch((error)=>{
    console.log(error)
})