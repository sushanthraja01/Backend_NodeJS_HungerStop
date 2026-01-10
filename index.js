const express = require('express');
const mongoose = require('mongoose');
const VenderRouter = require('./routes/VendorRouter');
const FirmRouter = require('./routes/FirmRouter');
const ProductRouter = require('./routes/ProductRouter');
const app = express();
const cors = require('cors'); 
const path = require('path');
const Vendor = require('./models/Vendor');
require('dotenv').config();
const cookieParser = require("cookie-parser");
const passport = require("passport")
const nodemailer = require("nodemailer");


app.use(express.json());
app.set('trust proxy', 1);
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://hungerspot-backend-dashboard.vercel.app',
  'https://hungerstop-rsds.vercel.app',
  'https://rsds-hunger-stop.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));



app.use((req, res, next) => {
  console.log(req.method, req.path);
  next();
});

app.use("/vendor", VenderRouter);
app.use("/firm", FirmRouter);
app.use("/product", ProductRouter);
app.use("/uploads", express.static('uploads'));


const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.brevo_user,
    pass: process.env.brevo_pass
  }
});

// SMTP Test Route
app.get("/smtp-test", async (req, res) => {
  try {
    await transporter.verify();
    res.send("SMTP connection OK");
  } catch (e) {
    console.error(e);
    res.status(500).send("SMTP connection failed");
  }
});

app.use("/", (req, res) => {
  res.send("<h1 align='center'>Welcome to HungerStop Backend Site</h1>");
});


mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`Server started and listening at port ${process.env.PORT}`);
      console.log("Connected to database");
      console.log("its dirnamein index.js",__dirname);
      console.log("Resolved Mongo URI at runtime:", process.env.MONGO_URI);
    });
  })
  .catch((error) => {
    console.log(error);
  });
