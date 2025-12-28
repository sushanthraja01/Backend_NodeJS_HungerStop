const express = require('express')
const productcontroller = require('../controllers/productController')

const router = express.Router();

router.post("/addproduct/:id",productcontroller.upload.single("image"),productcontroller.addproduct)
router.get("/productsbyfirm/:firmId",productcontroller.getproductbyfirm)
router.get("/allproducts",productcontroller.getallprods)
router.delete("/:productId",productcontroller.delprodbyid)

module.exports = router;