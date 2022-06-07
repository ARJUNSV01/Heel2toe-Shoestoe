/* eslint-disable no-unused-vars */
/* eslint-disable no-async-promise-executor */
var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
const { reject } = require("bcrypt/promises");
const { ObjectId } = require("mongodb");

module.exports = {
  vendorSignup: (vendorData) => {
    return new Promise(async (resolve, reject) => {
      const check = await db
        .get()
        .collection(collection.VENDOR_COLLECTION)
        .findOne({ email: vendorData.email });
      if (check) {
        reject();
      } else {
        vendorData.isActive = true;
        vendorData.approved=false
        delete vendorData.cpassword;
        vendorData.password = await bcrypt.hash(vendorData.password, 10);
        db.get()
          .collection(collection.VENDOR_COLLECTION)
          .insertOne(vendorData)
          .then((data) => {
            console.log(data);
            resolve(data.insertedId);
          });
      }
    });
  },
  vendorLogin: (vendorData) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let vendor = await db
        .get()
        .collection(collection.VENDOR_COLLECTION)
        .findOne({ email: vendorData.email });

      if (vendor) {
        delete vendor.products;
        let status = await bcrypt.compare(vendorData.password, vendor.password);
        if (status) {
          console.log("sucess");
          response.vendor = vendor;
          response.status = status;
          resolve(response);
        } else {
          console.log("fail");
          resolve({ status: false });
        }
      } else {
        console.log("fail");
        resolve({ status: false });
      }
    });
  },
  updateProfile: (updatedInfo, vendorId) => {
    console.log(updatedInfo,vendorId);
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.VENDOR_COLLECTION)
        .updateOne(
          { _id: ObjectId(vendorId) },
          {
            $set: {
              firstname: updatedInfo.firstname,
              lastname: updatedInfo.lastname,
              phonenumber: updatedInfo.phonenumber,
              email: updatedInfo.email,
             address:updatedInfo.address
            },
          }
        );
      resolve();
    });
  },getVendorDetails: (vendorId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.VENDOR_COLLECTION)
        .findOne({ _id: ObjectId(vendorId) })
        .then((vendorDetails) => {
          resolve(vendorDetails);
        });
    });
  },
};
