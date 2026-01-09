const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const verifyToken = require('../middleware/verifytoken');
const passport = require("passport")


router.post("/register",vendorController.vendorRegistration);
router.post("/login",vendorController.vendorLogin);
router.get("/auth/google",(req,res,next)=>{passport.authenticate("google", { scope: ["profile", "email"], state: req.query.state })(req,res,next);});
router.get("/auth/google/callback",passport.authenticate("google", { session: false }),vendorController.callback);
router.patch("/changerole",vendorController.crole);
router.patch("/changepassword",verifyToken,vendorController.cpass);
router.patch("/reqotp",verifyToken,vendorController.reqotp);
router.patch("/validateotp",verifyToken,vendorController.validateotp);
router.get('/getallvendors',vendorController.getallfirms);
router.get('/single-vendor/:id',vendorController.getsinglevendor);
router.patch('/forgotpassword',vendorController.forgotpassword)
router.patch('/logout',verifyToken,vendorController.logout)
router.patch('/hsl',vendorController.hsl)
router.get('/vt',verifyToken,vendorController.vt)

module.exports = router;