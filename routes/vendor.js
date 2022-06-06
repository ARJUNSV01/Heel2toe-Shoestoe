/* eslint-disable no-unused-vars */
const { response } = require("express");
var express = require("express");
const { ObjectId } = require("mongodb");
const orderHelper = require("../helpers/order-helper");
const { getProductDetails } = require("../helpers/product-helper");
const productHelper = require("../helpers/product-helper");
var router = express.Router();
var vendorHelper = require("../helpers/vendor-helper");
const { route } = require("./users");


let verifyLogin = (req, res, next) => {
  if (req.session.vendorLogged) {
    next();
  } else {
    res.render("vendor/please-login")
  }
};

router.get("/", (req, res) => {
  res.render("vendor/vendorsignup", {
    user: false,
    alreadyexistvendor: req.session.alreadyexistvendor,
  });
  req.session.alreadyexistvendor = false;
});
router.get("/login", (req, res) => {
  if (req.session.vendorLogged) {
    if (req.session.vendor.isActive) {
      res.redirect("/vendor/home");
    } else {
      res.render("vendor/vendorlogin", {
        vendorBlocked: req.session.vendorBlocked,
      });
      req.session.vendorBlocked = false;
    }
  } else {
    res.render("vendor/vendorlogin", { loginerr: req.session.vendorloginErr });
    req.session.vendorloginErr = false;
  }
});

router.post("/vendorsignup", (req, res) => {
  vendorHelper
    .vendorSignup(req.body)
    .then((response) => {
      console.log(response);
      res.redirect("/vendor/login");
    })
    .catch(() => {
      req.session.alreadyexistvendor = true;
      res.redirect("/vendor");
    });
});

router.post("/vendorlogin", (req, res) => {
  vendorHelper.vendorLogin(req.body).then((response) => {
    if (response.status) {
      req.session.vendorLogged = true;
      req.session.vendor = response.vendor;
      if (req.session.vendor.isActive === true) {
        res.redirect("/vendor/home");
      } else {
        req.session.vendorBlocked = true;
        res.redirect("/vendor/login");
      }
    } else {
      req.session.vendorloginErr = true;
      res.redirect("/vendor/login");
    }
  });
});
router.get("/home", (req, res) => {
  if (req.session.vendorLogged) {
    let vendorData = req.session.vendor;
    res.render("vendor/home", { vendorData, vendor: true });
  } else {
    res.redirect("/vendor/login");
  }
});
router.get("/home/viewproducts", (req, res) => {
  if (req.session.vendorLogged) {
    let vendorData = req.session.vendor;
    productHelper.viewProducts(vendorData).then((products) => {
      res.render("vendor/tables", { vendor: true, products, vendorData });
    });
  } else {
    res.redirect("/vendor/login");
  }
});
router.get("/home/addproducts", (req, res) => {
  if (req.session.vendorLogged) {
    let vendorData = req.session.vendor;
    res.render("vendor/add-product", { vendor: true, vendorData });
  } else {
    res.redirect("/vendor/login");
  }
});

router.post("/home/addproducts", (req, res) => {
  productHelper.addProducts(req.body, req.session.vendor._id).then((id) => {
    if (req.files) {
      if (req.files.image1) {
        addImage(req.files.image1, 1, id);
      }
      if (req.files.image2) {
        addImage(req.files.image2, 2, id);
      }
      if (req.files.image3) {
        addImage(req.files.image3, 3, id);
      }
      if (req.files.image4) {
        addImage(req.files.image4, 4, id);
      }
    }
    res.redirect("/vendor/home/addproducts");
  });
});

function addImage(image, n, id) {
  image.mv("public/images/productsImages/" + id + "(" + n + ")" + ".jpg");
}

router.get("/home/viewproducts/delete/:id", (req, res) => {
  let productId = req.params.id;
  console.log(productId);
  productHelper.deleteProducts(req.session.vendor._id, productId).then(() => {
    res.redirect("/vendor/home/viewproducts");
  });
});
router.get("/home/viewproducts/edit/:id", (req, res) => {
  if (req.session.vendorLogged) {
    let vendorData = req.session.vendor;
    let productId = req.params.id;
    productHelper.getProductDetails(productId).then((product) => {
      console.log(product);
      res.render("vendor/edit-product", { vendor: true, vendorData, product });
    });
  } else {
    res.redirect("/vendor/login");
  }
});
router.post("/product/update/:id", (req, res) => {
  let productId = req.params.id;

  productHelper.updateProduct(productId, req.body).then(() => {
    if (req.files) {
      if (req.files.image1) {
        addImage(req.files.image1, 1, productId);
      }
      if (req.files.image2) {
        addImage(req.files.image2, 2, productId);
      }
      if (req.files.image3) {
        addImage(req.files.image3, 3, productId);
      }
      if (req.files.image4) {
        addImage(req.files.image4, 4, productId);
      }
    }
    res.redirect("/vendor/home/viewproducts");
  });
});
router.get("/home/viewproducts/view/:id", (req, res) => {
  if (req.session.vendorLogged) {
    let vendorData = req.session.vendor;
    productHelper.getProductDetails(req.params.id).then((product) => {
      console.log(product);
      if (
        product.products.gender == "men" ||
        product.products.gender == "women"
      ) {
        let adult = true;
        res.render("vendor/viewproduct", {
          product,
          vendor: true,
          vendorData,
          adult,
        });
      } else {
        let kids = true;
        res.render("vendor/viewproduct", {
          product,
          vendor: true,
          vendorData,
          kids,
        });
      }
    });
  } else {
    res.redirect("/vendor/login");
  }
});
router.get('/viewOrders',verifyLogin,(req,res)=>{
  let vendorData = req.session.vendor;
    orderHelper.viewOrders(vendorData._id).then((orders)=>{
      console.log(true,orders);
      res.render('vendor/view-orders',{vendor:true,vendorData,orders})
    })
})
router.get("/viewOrders/orderedItems/:id", (req, res) => {
  orderHelper.getOrderedProducts(req.params.id).then((orders) => {
    let vendorData=req.session.vendor
    let productDetails = orders.productDetails;
    res.render("vendor/ordered-items", { vendor: true, orders, productDetails,vendorData });
  });
});
router.get('/shipOrder/:id',(req,res)=>{
  orderHelper.shipOrder(req.params.id).then(()=>{
    res.redirect('/vendor/viewOrders')
  })
})
router.get("/logout", (req, res) => {
  req.session.vendorLogged = false;
  res.redirect("/vendor/login");
});
module.exports = router;
