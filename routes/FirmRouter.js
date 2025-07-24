const express = require('express')
const verifyToken = require('../middleware/verifytoken')
const firmcontroller = require('../controllers/firmController')
const router = express.Router();

router.post("/add-firm",verifyToken,firmcontroller.addfirm)
router.delete("/:id",firmcontroller.delfrimbyid)

router.get("/uploads/:imagename",async(req, res) => {
    const imgname = req.params.imagename;
    res.headersSent('Content-type','image/jpeg')
    res.sendFile(path.join(__dirname,'..','uploads',imgname))
});

module.exports = router