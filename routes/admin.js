var express = require('express');
var router = express.Router();
const multer = require('multer');


const productHelpers = require("../helpers/productHelpers")


const storage = multer.diskStorage({
  destination: 'public/images',
  filename: (req, file, cb) => {
    // Generate a new filename
    const newFilename = Date.now() + '-' + file.originalname;
    cb(null, newFilename);
  }
});

const upload = multer({ storage });

/* GET all products  */
router.get('/', async function (req, res, next) {
  const products = await productHelpers.getAllProducts();
  res.render("admin/view-products", { products, admin: true })
 
  
});

// show add product page 
router.get("/add-products", (req, res) => {
  res.render("admin/add-products")
})

// add product to database in dbproduct collection 
router.post("/add-products", upload.single("image"), async (req, res) => {
  await productHelpers.addProducts(req)
  res.redirect('/admin');
 
})



// find one product
router.get("/edit/:id", async (req, res) => {
  const products = await productHelpers.getOneProductbyId(req)
  res.render("admin/edit-product", { products, admin: true })
})

// edit one product |update product
router.post("/edit/:id", upload.single("image"), async (req, res) => {

  await productHelpers.updateOneProductById(req);

  res.redirect('/admin');

}
)

// delete product

router.get("/delete/:id", async (req, res) => {
  let id = req.params
  await productHelpers.deleteProductByid(req);
  res.redirect('/admin');


})



module.exports = router;
