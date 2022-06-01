/* eslint-disable no-unused-vars */
var express = require("express");
let productHelper = require("../helpers/product-helper");
var router = express.Router();
const userHelper = require("../helpers/user-helper");
const cartHelper = require("../helpers/cart-helper");
const orderHelper = require("../helpers/order-helper");
const { ObjectId } = require("mongodb");
var db = require("../config/connection");
var collection = require("../config/collections");

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
    res.render("user/userlogin", { blockeduser: req.session.blocked });
  }
};

router.get("/", (req, res) => {
  let userData = req.session.user;

  res.render("user/home", { userData, user: true });
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
  userHelper
    .doSignup(req.body)
    .then((response) => {
      console.log(response);
      res.redirect("/login");
    })
    .catch(() => {
      req.session.alreadyExist = true;
      res.redirect("/signup");
    });
});
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

  try {
    productHelper.shoppingViewProducts(req.params.id).then((menProducts) => {
      res.render("user/shopping", { user: true, userData, menProducts });
    });
  } catch (err) {
    console.log(err);
  }
});

router.get("/shopping/view/:id", async (req, res) => {
  let userData = req.session.user;
  let productId = req.params.id;
  try {
    productHelper.getProductDetails(req.params.id).then((product) => {
      console.log(product);
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
      });
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
          { $project: { products: 1, _id: 0 } },
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

router.get("/cart/delete/:id", (req, res) => {
  cartHelper.deleteItem(req.params.id).then(() => {
    res.json({ deleted: true });
  });
});
router.get("/clearCart", (req, res) => {
  cartHelper.clearCart(req.session.user).then(() => {
    res.json({ deleted: true });
  });
});
router.get("/checkout", (req, res) => {
  let userData = req.session.user;

  cartHelper.viewCart(userData._id).then((cartDetails) => {
    if (cartDetails.length != 0) {
      res.render("user/checkout", { user: true, userData, cartDetails });
    } else {
      res.render("user/cart");
    }
  });
});
router.post("/updateAddress", async (req, res) => {
  let cart = await orderHelper.getCart(req.session.user._id);
  console.log(cart);

  orderHelper.placeOrder(req.session.user, req.body, cart).then((details) => {
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
router.get("/addcount/:id", (req, res) => {
  let cartId = req.params.id;
  cartHelper.addQty(cartId).then(() => {
    res.json({ added: true });
  });
});
router.get("/subcount/:id", (req, res) => {
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

router.post("/verify-payment", (req, res) => {
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
router.get("/orderSuccess", (req, res) => {
  res.render("user/paymentConf");
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
router.post("/updateprofile", (req, res) => {
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
router.get("/orderedItems/:id", (req, res) => {
  orderHelper.getOrderedProducts(req.params.id).then((orders) => {
    let userData=req.session.user
    let productDetails = orders.productDetails;
    res.render("user/ordered-items", { user: true, orders, productDetails,userData });
  });
});
module.exports = router;
