/* eslint-disable no-unused-vars */
const { response } = require("express");
var express = require("express");
const session = require("express-session");
var router = express.Router();
var adminHelper = require("../helpers/admin-helper");

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
      admin: true,
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

router.get("/home", (req, res) => {
  if (req.session.loggedAdmin) {
    let admintrue = req.session.admin;
    console.log(admintrue);
    res.render("admin/adminhome", { admintrue, admin: true });
  } else {
    res.redirect("/admin");
  }
});
router.get("/viewusers", (req, res) => {
  if (req.session.loggedAdmin) {
    adminHelper.getAllUsers().then((users) => {
      console.log(users);
      let admintrue = req.session.admin;
      res.render("admin/view-users", { admin: true, users, admintrue });
    });
  } else {
    res.redirect("/admin");
  }
});

router.get("/viewusers/userdetails", (req, res) => {
  if (req.session.loggedAdmin) {
    let admintrue = req.session.admin;
    res.render("admin/user-details", { admintrue, admin: true });
  } else {
    res.redirect("/admin");
  }
});

router.get("/viewusers/deleteuser/:id", (req, res) => {
  let userId = req.params.id;
  adminHelper.deleteUser(userId).then((response) => {
    console.log(response);
    res.redirect("/admin/viewusers");
  });
});

router.get("/viewusers/blockuser/:id", (req, res) => {
  let userId = req.params.id;
  adminHelper.blockUser(userId).then((response) => {
    console.log(response);

    res.redirect("/admin/viewusers");
  });
});
router.get("/viewusers/unBlockuser/:id", (req, res) => {
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

module.exports = router;
