/* eslint-disable no-unused-vars */
/* eslint-disable no-async-promise-executor */
var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");
const { reject } = require("bcrypt/promises");
// const { reject } = require('bcrypt/promises')

module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      const check = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ email: userData.email });
      if (check) {
        reject();
      } else {
        userData.isActive = true;
        delete userData.cpassword;
        userData.password = await bcrypt.hash(userData.password, 10);
        db.get()
          .collection(collection.USER_COLLECTION)
          .insertOne(userData)
          .then((data) => {
            resolve(data.insertedId);
          });
      }
    });
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ email: userData.email });
      if (user) {
        bcrypt.compare(userData.password, user.password).then((status) => {
          if (status) {
            console.log("login success");
            response.user = user;
            response.status = true;
            resolve(response);
          } else {
            console.log("login failed");
            resolve({ status: false });
          }
        });
      } else {
        console.log("login failed");
        resolve({ status: false });
      }
    });
  },
  updateProfile: (updatedInfo, userId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: ObjectId(userId) },
          {
            $set: {
              firstname: updatedInfo.firstname,
              lastname: updatedInfo.lastname,
              phonenumber: updatedInfo.phonenumber,
              email: updatedInfo.email,
              "Address.house": updatedInfo.house,
              "Address.city": updatedInfo.city,
              "Address.state": updatedInfo.state,
              "Address.pincode": updatedInfo.pincode,
            },
          }
        );
      resolve();
    });
  },
  getUserDetails: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: ObjectId(userId) })
        .then((userDetails) => {
          resolve(userDetails);
        });
    });
  },
};
