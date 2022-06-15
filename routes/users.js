/* eslint-disable no-unused-vars */
var express = require("express");
let productHelper = require("../helpers/product-helper");
var router = express.Router();
require('dotenv').config();

const userHelper = require("../helpers/user-helper");
const cartHelper = require("../helpers/cart-helper");
const orderHelper = require("../helpers/order-helper");
const otpHelper=require('../helpers/otp-helper')
const { ObjectId } = require("mongodb");
var db = require("../config/connection");
var collection = require("../config/collections");
var nodemailer = require('nodemailer');
const session = require("express-session");
var menProducts,searchKeyword,searchResult

let verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next();
  } else {
    res.render("user/please-login");
  }
};

let userBlocked = (req, res, next) => {
  if (req.session.blocked == false) {
    next();
  } else {
    req.session.loggedIn = false;
    req.session.user = false;
    res.render("user/userlogin", { blockeduser: req.session.blocked });
  }
};

router.get("/", (req, res) => {
  let userData = req.session.user;
  productHelper.getLatestProducts().then((latestProducts) => {
    res.render("user/home", { userData, user: true, latestProducts });
  });
});

router.get("/login", function (req, res) {
  if (req.session.loggedIn) {
    if (req.session.user.isActive) {
      res.redirect("/");
    } else {
      res.render("user/userlogin", { blockeduser: req.session.blocked });
      req.session.blocked = false;
    }
  } else {
    res.render("user/userlogin", { loginErr: req.session.loginErr });
    req.session.loginErr = false;
  }
});
router.get("/signup", (req, res) => {
  res.render("user/usersignup", { alreadyExist: req.session.alreadyExist });
  req.session.alreadyExist = false;
});
router.post("/signup", (req, res) => {
  const{email,phonenumber}=req.body
  req.session.number=phonenumber
  req.session.email=email
  req.session.whole=req.body
  otpHelper.makeOtp(phonenumber).then((verification)=>
  console.log(verification))

  
  res.render('user/verification',{whole:req.session.whole})
});
router.post('/verify',(req,res)=>{
  let{otp}=req.body
  otp=otp.join("")
  console.log(otp);
  const phone_number=req.session.number
  otpHelper.verifyOtp(otp,phone_number).then((verification_check)=>{
    if(verification_check.status=="approved"){
      console.log("approved");
      req.session.checkstatus=true
      userHelper
    .doSignup(req.session.whole)
    .then((response) => {
      console.log(response);
      res.redirect("/login");
    })
    .catch(() => {
      req.session.alreadyExist = true;
      res.redirect("/signup");
    });
    }else{
      console.log('not approved');
      res.redirect('/signup')
    }
  })
})

router.post("/login", (req, res) => {
  userHelper.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true;
      req.session.user = response.user;
      // console.log(req.session.user.isActive)

      if (req.session.user.isActive === true) {
        res.redirect("/");
      } else {
        req.session.blocked = true;
        res.redirect("/login");
      }
    } else {
      req.session.loginErr = true;
      res.redirect("/login");
    }
  });
});

router.get("/shopping/:id", async (req, res) => {
  let userData = req.session.user;
  req.session.gender = req.params.id;
  // try {
  //   productHelper.shoppingViewProducts(req.params.id).then((menProducts) => {
  //     productHelper.getBrands().then((brands)=>{
  //       res.render("user/shopping", { user: true, userData, menProducts ,brands});
  //     })

  //   });
  // } catch (err) {
  //   console.log(err);
  // }
  productHelper.shoppingViewProducts(req.params.id).then((response) => {
    menProducts = response;
    res.redirect("/products");
  });
});
router.get("/products", (req, res) => {
  let userData = req.session.user;
  productHelper.getBrands().then((brands) => {
    let categories = productHelper.getCategories().then((categories) => {
      res.render("user/shopping", {
        user: true,
        userData,
        menProducts,
        brands,
        categories,
      });
    });
    // console.log(true,pro);
  });
});
router.post("/products/filter", (req, res) => {
  let a = req.body;
  console.log(a);
  let filter = [];
  for (let i of a.brandName) {
    filter.push({ "products.brand": i });
  }
  let catFilter = [];
  for (let i of a.category) {
    catFilter.push({ "products.category": i });
  }
  console.log(true, filter, false);
  let gender = req.session.gender;
  productHelper.filterProducts(filter, catFilter, gender).then((response) => {
    menProducts = response;
    console.log(false, menProducts);

    if (a.sortBy == "Sort") {
      res.json({ status: true });
    }
    if (a.sortBy == "rating") {
      menProducts.sort((a, b) => {
        return b.products.avgRating - a.products.avgRating;
      });
      res.json({ status: true });
    }
    if (a.sortBy == "netPricelowtohigh") {
    menProducts.sort((a, b) => {
        return a.products.netprice - b.products.netprice;
      });
      res.json({ status: true });
    }
    if (a.sortBy == "netPricehightolow") {
      menProducts.sort((a, b) => {
        return b.products.netprice - a.products.netprice;
      });
      res.json({ status: true });
    }
  });
});

router.get("/shopping/view/:id", async (req, res) => {
  let userData = req.session.user;
  let productId = req.params.id;
  try {
    productHelper.getProductDetails(req.params.id).then((product) => {
      let avgRating = product.avgRating;
      let reviews = product.reviews;

      if (
        product.products.gender == "men" ||
        product.products.gender == "women"
      ) {
        var adult = true;
      }
      res.render("user/product-view", {
        user: true,
        product,
        userData,
        productId,
        adult,
        avgRating,
        reviews,
        cantRate: req.session.cantRate,
      });
      req.session.cantRate = false;
    });
  } catch (err) {
    console.log(err);
  }
});

router.post("/shopping/viewProduct/:id", verifyLogin, (req, res) => {
  let productId = req.params.id;
  let userId = req.session.user._id;
  let size = req.body.size;
  console.log(userId);
  console.log(productId);
  console.log(req.body.size);
  cartHelper
    .addToCart(size, productId, userId)
    .then(() => {
      res.redirect(`/shopping/view/${req.params.id}`);
    })
    .catch(async (productid) => {
      let singleproduct = await db
        .get()
        .collection(collection.VENDOR_COLLECTION)
        .aggregate([
          { $unwind: "$products" },
          { $match: { "products._id": ObjectId(productid) } },
          { $project: { products: 1 } },
        ])
        .toArray();
      singleproduct = singleproduct[0];
      let netprice =
        (singleproduct.products.price *
          (100 - singleproduct.products.discount)) /
        100;

      let userCart = {
        cartId: new ObjectId(),
        productId: productid,
        vendorId: singleproduct._id,
        brand:singleproduct.products.brand,
        title: singleproduct.products.title,
        price: singleproduct.products.price * 1,
        discount: singleproduct.products.discount * 1,
        netprice: netprice,
        size: req.body.size,
        quantity: 1,
        total: singleproduct.products.netprice * 1,
        totalMRP: singleproduct.products.price * 1,
      };
      await db
        .get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: ObjectId(req.session.user._id) },
          {
            $push: {
              cart: userCart,
            },
          },
          { upsert: true }
        );
      res.redirect(`/shopping/view/${req.params.id}`);
    });
});

router.get("/cart/:id", verifyLogin, (req, res) => {
  let userData = req.session.user;
  try {
    cartHelper.viewCart(req.params.id).then((cartDetails) => {
      res.render("user/cart", { user: true, userData, cartDetails });
    });
  } catch (err) {
    console.log(err);
  }
});

router.get("/cart/delete/:id", verifyLogin,(req, res) => {
  cartHelper.deleteItem(req.params.id).then(() => {
    res.json({ deleted: true });
  });
});
router.get("/clearCart", verifyLogin,(req, res) => {
  cartHelper.clearCart(req.session.user).then(() => {
    res.json({ deleted: true });
  });
});
router.get("/checkout",verifyLogin, (req, res) => {
  let userData = req.session.user;

  cartHelper.viewCart(userData._id).then((cartDetails) => {
    if (cartDetails.length != 0) {
      res.render("user/checkout", { user: true, userData, cartDetails });
    } else {
      req.session.emptyCart = true;
      res.render("user/cart", {
        user: true,
        userData,
        emptyCart: req.session.emptyCart,
      });
      req.session.emptyCart = false;
    }
  });
});
router.post("/updateAddress",verifyLogin, async (req, res) => {
  let cart = await orderHelper.getCart(req.session.user._id);
  console.log(cart);

  orderHelper.placeOrder(req.session.user, req.body, cart).then((details) => {
    req.session.orderId = details.orderId;
    console.log(details);
    if (req.body.modeofpayment == "cod") {
      orderHelper.changeQtyAfterOrder(req.session.user._id);
      cartHelper.clearCart(req.session.user);
      res.json({ codSuccess: true });
    }
    if (req.body.modeofpayment == "onlinepayment") {
      orderHelper.generateRazorpay(details).then((response) => {
        res.json(response);
      });
    }
  });
});
router.get("/addcount/:id",verifyLogin, (req, res) => {
  let cartId = req.params.id;
  cartHelper.addQty(cartId).then(() => {
    res.json({ added: true });
  });
});
router.get("/subcount/:id",verifyLogin, (req, res) => {
  let cartId = req.params.id;
  cartHelper.subQty(cartId).then(() => {
    res.json({ sub: true });
  });
});

router.get("/logout", (req, res) => {
  req.session.loggedIn = false;
  req.session.user = false;
  res.redirect("/");
});

router.post("/verify-payment",verifyLogin, (req, res) => {
  console.log(req.body);
  orderHelper
    .verifyPayment(req.body)
    .then(() => {
      orderHelper.changePaymentStatus(req.body["order[receipt]"]).then(() => {
        console.log("payment success");
        orderHelper.changeQtyAfterOrder(req.session.user._id);
        cartHelper.clearCart(req.session.user);
        res.json({ status: true });
      });
    })
    .catch((err) => {
      console.log(err);
      res.json({ status: false, errMsg: "payment failed" });
    });
});
router.get("/orderSuccess",verifyLogin,async(req, res) => {
let orderedProducts = await orderHelper.getOrderedProducts(req.session.orderId)
console.log(orderedProducts);
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.NODEMAILER_USER,
      pass: process.env.NODEMAILER_PASS
    }
  });
  
  var mailOptions = {
    from: process.env.NODEMAILER_USER,
    to: 'arjunsv9@gmail.com',
    subject: 'Your Heel2toe Order Confirmation',
    // html: `<h4>Your order of </h4> <h3>order id : ${orderedProducts.orderId}</h3><h4>of amount </h4><h3>Rs. ${orderedProducts.totalAmount}</h3>  <h4> placed on </h4> <h3>${orderedProducts.time}</h3><h4> has been confirmed & it will be shipped within 2 days.</h4>`
    html: `Your order of order id:<b> ${orderedProducts.orderId}</b> of amount <b>Rs. ${orderedProducts.totalAmount}</b>   placed on  <b>${orderedProducts.time}</b> has been confirmed & it will be shipped within 2 days.`
  };
  
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
  
  res.render("user/paymentConf");
});

router.get("/orderSummary",verifyLogin, (req, res) => {
  try {
    let userData = req.session.user;
    orderHelper.getOrderedProducts(req.session.orderId).then((orderDetails) => {
      res.render("user/orderSummary", { orderDetails, user: true, userData });
    });
  } catch (err) {
    console.log(err);
  }
});

router.get("/editProfile/:id", verifyLogin, (req, res) => {
  try {
    userHelper.getUserDetails(req.params.id).then((userData) => {
      res.render("user/profile-edit", {
        user: true,
        userData,
        updated: req.session.updated,
      });
      req.session.updated = false;
    });
  } catch (err) {
    console.log(err);
  }
});
router.post("/updateprofile", verifyLogin, (req, res) => {
  let userData = req.session.user;
  console.log(req.body);
  userHelper.updateProfile(req.body, userData._id).then(() => {
    req.session.updated = true;
    res.json({ updated: true });
  });
});
router.get("/viewProfile/:id", verifyLogin, (req, res) => {
  try {
    userHelper.getUserDetails(req.params.id).then((userData) => {
      res.render("user/view-profile", { user: true, userData });
    });
  } catch (err) {
    console.log(err);
  }
});
router.get("/viewOrders/:id", verifyLogin, (req, res) => {
  let userData = req.session.user;
  try {
    orderHelper.getOrderDetails(userData._id).then((orders) => {
      res.render("user/view-orders", { user: true, userData, orders });
    });
  } catch (err) {
    console.log(err);
  }
});
router.get("/orderedItems/:id", verifyLogin, (req, res) => {
  orderHelper.getOrderedProducts(req.params.id).then((orders) => {
    let userData = req.session.user;
    let productDetails = orders.productDetails;
    for (let one of productDetails) {
      one.orderId = orders.orderId;
    }
    console.log(productDetails);
    if (orders.status == "Cancelled") {
      res.render("user/ordered-items", {
        user: true,
        orders,
        productDetails,
        userData,
        orderCancelled: true,
      });
    } else {
      res.render("user/ordered-items", {
        user: true,
        orders,
        productDetails,
        userData,
      });
    }
  });
});
router.get("/cancelOrder",verifyLogin, (req, res) => {
  const { orderId, cartId, productId, size, quantity } = req.query;
  console.log(false, req.query);
  orderHelper.cancelOrder(orderId, cartId).then(() => {
    orderHelper.changeQtyAfterCancel(productId, size, quantity);
    res.json({ status: true });
  });
});
router.post("/submit-reviews", (req, res) => {
  productHelper
    .submitReviews(req.body, req.session.user._id)
    .then(() => {
      res.json({ status: true });
      // res.redirect("/shopping/view/" + req.params.id);
    })
    .catch(() => {
      req.session.cantRate = true;
      res.json({ status: false });
    });
});
// router.get("/sortedProducts/:id", (req, res) => {
//   let gender = req.session.gender;
//   let userData = req.session.user;
//   let category = req.session.category;
//   let brand = req.session.brand;
//   productHelper
//     .getSortedProducts(req.params.id, gender, category, brand)
//     .then((menProducts) => {
//       res.render("user/shopping", { menProducts, userData, user: true });
//     });
// });
// router.get("/sortedProducts/:id", (req, res) => {
//   if (req.params.id == "rating") {
//     menProducts.sort((a, b) => {
//       return b.products.avgRating - a.products.avgRating;
//     });
//     res.json({ status: true });
//   }
//   if (req.params.id == "netPricelowtohigh") {
//     menProducts.sort((a, b) => {
//       return a.products.netprice - b.products.netprice;
//     });
//     res.json({ status: true });
//   }
//   if (req.params.id == "netPricehightolow") {
//     menProducts.sort((a, b) => {
//       return b.products.netprice - a.products.netprice;
//     });
//     res.json({ status: true });
//   }
// });
// router.get("/shopByCategory/:id", (req, res) => {
//   let gender = req.session.gender;
//   req.session.category = req.params.id;
//   let category = req.session.category;
//   productHelper.shopByCategory(req.params.id, gender).then((menProducts) => {
//     res.render("user/shopping", { user: true, menProducts });
//   });
// });
// router.get("/shopByBrands/:id", (req, res) => {
//   req.session.brand = req.params.id;
//   let gender = req.session.gender;
//   let category = req.session.category;
//   productHelper
//     .shopByBrands(req.params.id, category, gender)
//     .then((menProducts) => {
//       res.render("user/shopping", { user: true, menProducts });
//     });
// });
router.post("/products/search", (req, res) => {
  console.log(req.body);

  if (req.body.search) {
    searchKeyword = req.body.search;
    productHelper.search(searchKeyword).then((result) => {
      searchResult = result;
      console.log("searchResult:" + searchResult);
      res.redirect("/search");
    });
  } else {
    console.log(req.body);

    let a = req.body;

    let brandFilter = [];
    for (let i of a.SbrandName) {
      brandFilter.push({ "products.brand": i });
    }

    let catFilter = [];
    for (let i of a.Scategory) {
      catFilter.push({ "products.category": i });
    }
    console.log("holaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");

    let gender = req.session.gender;

    productHelper
      .filterProducts(brandFilter, catFilter, gender, searchKeyword)
      .then((response) => {
        searchResult = response;
        console.log(searchResult);
        if (a.sortBy == "Sort") {
          res.json({ status: true });
        }
        if (a.sortBy == "rating") {
          searchResult.sort((a, b) => {
            return b.products.avgRating - a.products.avgRating;
          });
          res.json({ status: true });
        }
        if (a.sortBy == "netPricelowtohigh") {
          searchResult.sort((a, b) => {
            return a.products.netprice - b.products.netprice;
          });
          res.json({ status: true });
        }
        if (a.sortBy == "netPricehightolow") {
          searchResult.sort((a, b) => {
            return b.products.netprice - a.products.netprice;
          });
          res.json({ status: true });
        }
      });
  }
});
router.get("/search", (req, res) => {
  productHelper.getBrands().then((brands) => {
    let categories = productHelper.getCategories().then((categories) => {
      let userData = req.session.user;
      res.render("user/shopping2", {
        user: true,
        userData,
        searchResult,
        brands,
        categories,
      });
    });
  });
});
module.exports = router;
