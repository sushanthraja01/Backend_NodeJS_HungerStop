const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController')


router.post("/register",vendorController.vendorRegistration);
router.post("/login",vendorController.vendorLogin);

router.get('/getallvendors',vendorController.getallfirms)
router.get('/single-vendor/:id',vendorController.getsinglevendor)

module.exports = router;