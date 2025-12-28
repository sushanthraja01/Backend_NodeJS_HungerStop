const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const verifyToken = require('../middleware/verifytoken');


router.post("/register",vendorController.vendorRegistration);
router.post("/login",vendorController.vendorLogin);
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