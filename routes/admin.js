/* eslint-disable no-unused-vars */
const { response } = require("express");
var express = require("express");
const session = require("express-session");
var router = express.Router();
var nodemailer = require('nodemailer');
var adminHelper = require("../helpers/admin-helper");
const orderHelper=require("../helpers/order-helper")
const productHelper=require("../helpers/product-helper");
const vendorHelper = require("../helpers/vendor-helper");
/* GET home page. */
let adminlogged = (req, res, next) => {
  if (req.session.loggedAdmin) {
    next();
  } else {
    res.redirect("/admin");
  }
};

router.get("/", function (req, res) {
  if (req.session.loggedAdmin) {
    res.redirect("admin/home");
  } else {
    res.render("admin/adminlogin", {
      
      loginError: req.session.loginError,
    });
    req.session.loginError = false;
  }
});
router.post("/adminlog", (req, res) => {
  adminHelper.adminLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedAdmin = true;
      req.session.admin = response.admin;
      res.redirect("/admin/home");
    } else {
      req.session.loginError = true;
      res.redirect("/admin");
    }
  });
});

router.get("/home",adminlogged, async(req, res) => {
    let admintrue = req.session.admin;
    console.log(admintrue);
    let count=await adminHelper.requestsCount()
    
    adminHelper.totalRevenue().then((totalOrderDetails)=>{
      res.render("admin/adminhome", { admintrue, admin: true ,totalOrderDetails,count});
    })
   
  
});
router.get('/viewRedeemRequests',adminlogged,(req,res)=>{
  adminHelper.viewRedeemRequests().then((requests)=>{
    res.render('admin/viewRedeemRequests',{admin:true,requests})
  })
})
router.get('/paymentHistory',adminlogged,(req,res)=>{
  adminHelper.viewRedeemRequests().then((requests)=>{
    res.render('admin/paymentHistory',{admin:true,admintrue:req.session.admin,requests})
  })
})
router.get('/payNow',(req,res)=>{
  const{vendorId,amount,requestId,time}=req.query
  adminHelper.payAmount(vendorId,amount,requestId).then(()=>{
    var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'jcarl1998groove@gmail.com',
        pass: 'ljcimkghynpodvgg'
      }
    });
    
    var mailOptions = {
      from: 'jcarl1998groove@gmail.com',
      to: 'arjunsv9@gmail.com',
      subject: 'Payment Confirmation',
      // html: `<h4>Your order of </h4> <h3>order id : ${orderedProducts.orderId}</h3><h4>of amount </h4><h3>Rs. ${orderedProducts.totalAmount}</h3>  <h4> placed on </h4> <h3>${orderedProducts.time}</h3><h4> has been confirmed & it will be shipped within 2 days.</h4>`
        html:`An amount of <b>Rs.${amount}</b> has been credited to your wallet. <h6>Time:${time}</h6>`
    };
    
    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
    res.redirect('/admin/viewRedeemRequests')
  })
})
router.get("/viewusers",adminlogged, (req, res) => {
    adminHelper.getAllUsers().then((users) => {
      console.log(users);
      let admintrue = req.session.admin;
      res.render("admin/view-users", { admin: true, users, admintrue });
    });
});

router.get("/viewusers/userOrders/:id",adminlogged ,(req, res) => {
  orderHelper.getOrderDetails(req.params.id).then((orders) => {
    res.render("admin/user-orders", { admin: true, orders });
  });
});
router.get('/orderDetails/:id',adminlogged,(req,res)=>{
  orderHelper.getOrderedProducts(req.params.id).then((orders) => {
    console.log('hi');
    let admintrue=req.session.admin
    let productDetails = orders.productDetails;
    res.render("admin/user-order-details", { admin: true, orders, productDetails,admintrue});
  });
})

router.get("/viewusers/deleteuser/:id",adminlogged, (req, res) => {
  let userId = req.params.id;
  adminHelper.deleteUser(userId).then((response) => {
    console.log(response);
    res.redirect("/admin/viewusers");
  });
});

router.get("/viewusers/blockuser/:id",adminlogged, (req, res) => {
  let userId = req.params.id;
  adminHelper.blockUser(userId).then((response) => {
    console.log(response);

    res.redirect("/admin/viewusers");
  });
});
router.get("/viewusers/unBlockuser/:id",adminlogged, (req, res) => {
  let userId = req.params.id;
  adminHelper.unBlockUser(userId).then((response) => {
    console.log(response);

    res.redirect("/admin/viewusers");
  });
});

router.get("/logout", (req, res) => {
  req.session.loggedAdmin = false;
  res.redirect("/admin");
});
router.get("/viewVendors",adminlogged, (req, res) => {
  if (req.session.loggedAdmin) {
    adminHelper.getAllVendors().then((vendors) => {
      console.log(vendors);
      let admintrue = req.session.admin;
      res.render("admin/view-vendors", { admin: true, vendors, admintrue });
    });
  } else {
    res.redirect("/admin");
  }
});
router.get('/viewVendor/:id',adminlogged,(req,res)=>{
  let vendorData={
    _id:req.params.id
  }
  productHelper.viewProducts(vendorData).then((products)=>{
    adminHelper.getVendor(req.params.id).then((vendorDetails)=>{
    res.render('admin/viewVendor',{admin:true,products,vendorDetails})
  })
})
})
router.get("/viewVendors/vendorOrders/:id",adminlogged ,(req, res) => {
  orderHelper.viewOrders(req.params.id).then((orders)=>{
    let admintrue=req.session.admin
    res.render('admin/vendor-orders',{admin:true,admintrue,orders})
  })
});
router.get("/vendorOrderDetails/:id",adminlogged, (req, res) => {
  orderHelper.getOrderedProducts(req.params.id).then((orders) => {
    let admintrue=req.session.admin
    let productDetails = orders.productDetails;
    res.render("admin/vendor-order-details", { admin: true, orders, productDetails,admintrue });
  });
});
router.get("/viewVendors/blockVendor/:id",adminlogged, (req, res) => {
  let vendorId = req.params.id;
  console.log('hi');
  adminHelper.blockVendor(vendorId).then((response) => {
    console.log(response);

    res.redirect("/admin/viewVendors");
  });
});
router.get("/viewVendors/unBlockVendor/:id",adminlogged, (req, res) => {
  let vendorId = req.params.id;
  adminHelper.unBlockVendor(vendorId).then((response) => {
    console.log(response);
    res.redirect("/admin/viewVendors");
  });
});


module.exports = router;
