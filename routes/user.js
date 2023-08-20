var express = require('express');
var router = express.Router();
var productHelpers = require("../helpers/productHelpers")
var userHelper = require("../helpers/user-helpers");
const { ObjectId } = require('mongodb');




// user logging checking middleware


const UserLoggedMiddlware = (req, res, next) => {
  if (req.session.logged) {
    next()
  } else {
    res.redirect("/login")
  }
}
/* GET home page. */
router.get('/', async function (req, res, next) {
  const products = await productHelpers.getAllProducts();
  const user = req.session.user
  let CartCount = 0;
  if (req.session.logged) {
    CartCount = await userHelper.getCartCount(req.session.user._id)
  }

  res.render('index', { products, user, CartCount });
});


router.get("/login", (req, res) => {
  if (req.session.logged) {
    res.redirect("/")
  } else {
    res.render("User/login", { Err: req.session.LogErr })
    req.session.LogErr = null
  }

})
router.get("/signup", (req, res) => {
  res.render("User/signup")
})


router.post("/signup", async (req, res) => {
  const signup = await userHelper.doSignup(req)
  req.session.logged =
    req.session.user = signup
  res.redirect("/")
})

router.post("/login", async (req, res) => {
  const loging = await userHelper.doLogin(req)
  if (loging.status) {
    req.session.user = loging.user
    req.session.logged = true
    res.redirect("/")
  } else {
    req.session.LogErr = "invalid password / user id"
    res.redirect("/login")
  }
})

router.get("/logout", (req, res) => {
  req.session.destroy()
  res.redirect("/")
})
// cart page setting 

router.get("/cart", UserLoggedMiddlware, async (req, res) => {
  const product = await userHelper.getCartItems(req.session.user._id)
  const TotalPrice = await userHelper.TotalPriceCount(req.session.user._id)
  console.log(req.session.user._id);
  const user = req.session.user
  res.render("user/cart", { product, user, TotalPrice })

})
router.get("/add-to-cart/:id", UserLoggedMiddlware, async (req, res) => {

  try {
    console.log("api call");
    console.log(req.params.id);
    const userId = req.session.user._id;
    await userHelper.addToCart(req, res, userId);
    let CartCount = 0;
    if (req.session.logged) {
      CartCount = await userHelper.getCartCount(req.session.user._id)
    }
    res.json({ CartCount }); // Send the response only once
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' }); // Send an error response if something goes wrong
  }

})


router.post("/change-product-quantity", UserLoggedMiddlware, async (req, res) => {
  const quantityChange = await userHelper.changeProductQuantity(req.body)
  const product = await userHelper.getCartItems(req.session.user._id)
  const TotalPrice = await userHelper.TotalPriceCount(req.body.user)
  res.json({ quantityChange, product, TotalPrice })


})
router.post("/cart-product-remove", UserLoggedMiddlware, async (req, res) => {
  const removeItem = await userHelper.cartProductRemove(req.body)

  console.log(req.body);

  res.json({ removeItem })


})


// router.get("/place-order", async (req, res) => {
//   const user = req.session.user

//   res.render("user/Order",{user} )


// })

router.get("/place-order", UserLoggedMiddlware, async (req, res) => {

  const TotalPrice = await userHelper.TotalPriceCount(req.session.user._id)
  res.render("user/Order", { TotalPrice, user: req.session.user })


})


router.post("/place-order", UserLoggedMiddlware, async (req, res) => {

  const product = await userHelper.getCartProductList(req.body.userId)
  const TotalPrice = await userHelper.TotalPriceCount(req.body.userId)
  const orderId = await userHelper.placeOrder(req.body, product, TotalPrice)

  console.log("orderID");
  console.log(orderId);
  console.log(TotalPrice);
  console.log("toooooo");
  if (req.body.method === "COD") {
    res.json({ Cod_success: true })

  } else {

    await userHelper.generateRazorPay(orderId, TotalPrice).then((response) => {
      console.log(response);
      res.json(response)
    })


  }





})



router.get("/order_succes", UserLoggedMiddlware, async (req, res) => {

  res.render("user/order_success", { user: req.session.user })


})
router.get("/orders", UserLoggedMiddlware, async (req, res) => {
  const orders = await userHelper.getUserOrders(req.session.user._id)

  res.render("user/orders_status", { user: req.session.user, orders })
})

router.post("/verfy-payment", async (req, res) => {
  userHelper.verifyPayment(req.body).then(() => {
    userHelper.changePaymentStatus(req.body.order.receipt).then(() => {
      console.log("payment statuschange  duccss")
      res.json({ status: true })
    })
  }).catch((err) => {
    console.log(err);
    res.json({ status: false, errMes: "" })
  })

})




module.exports = router;
