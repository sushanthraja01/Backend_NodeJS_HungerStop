const express = require('express')
const verifyToken = require('../middleware/verifytoken')
const { reqaddfirm, delfrimbyid, upload, acceptreq, declinereq } = require("../controllers/firmController");
const router = express.Router();

router.post("/req/add-firm",verifyToken,upload.fields([
    { name: 'fssai', maxCount: 1 },
    { name: 'gst', maxCount: 1 },
    { name: 'shop_license', maxCount: 1 },
    { name: 'image', maxCount: 1 },
    { name: 'anual_income', maxCount: 1 }]
),reqaddfirm)
router.get("/accept/:id",acceptreq);
router.post("/decline/:id",declinereq);


router.delete("/:id",delfrimbyid)

router.get("/uploads/:imagename",async(req, res) => {
    const imgname = req.params.imagename;
    res.headersSent('Content-type','image/jpeg')
    res.sendFile(path.join(__dirname,'..','uploads',imgname))
});

module.exports = router