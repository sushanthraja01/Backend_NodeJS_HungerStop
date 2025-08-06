require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const VenderRouter = require('./routes/VendorRouter');
const FirmRouter = require('./routes/FirmRouter');
const ProductRouter = require('./routes/ProductRouter');
const app = express();
const cors = require('cors'); // Only require once
const path = require('path');

app.use(express.json());

const allowedOrigins = [
  'http://localhost:5173',
  'https://hungerspot-backend-dashboard.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // If no origin (e.g., for Postman or server-side requests), allow it
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(req.method, req.path);
  next();
});

app.use("/vendor", VenderRouter);
app.use("/firm", FirmRouter);
app.use("/product", ProductRouter);
app.use("/uploads", express.static('uploads'));

app.use("/", (req, res) => {
  res.send("<h1 align='center'>Welcome to HungerStop</h1>");
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`Server started and listening at port ${process.env.PORT}`);
      console.log("Connected to database");
    });
  })
  .catch((error) => {
    console.log(error);
  });
