const express = require('express')
const productcontroller = require('../controllers/productController')

const router = express.Router();

router.post("/addproduct/:id",productcontroller.addproduct)
router.get("/productsbyfirm/:productId",productcontroller.getproductbyfirm)
router.delete("/:productId",productcontroller.delprodbyid)

router.get("/uploads/:imagename", async (req, res) => {
    const imgname = req.params.imagename;
    const filepath = path.join(__dirname, '..', 'uploads', imgname);
    if (fs.existsSync(filepath)) {
        res.setHeader('Content-Type', 'image/jpeg');  // or detect type dynamically
        res.sendFile(filepath);
    } else {
        res.status(404).send("Image not found");
    }
});

module.exports = router;