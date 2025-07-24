const express = require('express')
const productcontroller = require('../controllers/productController')

const router = express.Router();

router.post("/addproduct/:id",productcontroller.addproduct)
router.get("/productsbyfirm/:productId",productcontroller.getproductbyfirm)
router.delete("/:productId",productcontroller.delprodbyid)

router.get("/uploads/:imagename",async(req, res) => {
    const imgname = req.params.imagename;
    res.headersSent('Content-type','image/jpeg')
    res.sendFile(path.join(__dirname,'..','uploads',imgname))
});

module.exports = router;