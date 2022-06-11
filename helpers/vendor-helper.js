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
        vendorData.claimedAmount=0
        vendorData.approved = false;
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
    console.log(updatedInfo, vendorId);
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
              address: updatedInfo.address,
            },
          }
        );
      resolve();
    });
  },
  getVendorDetails: (vendorId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.VENDOR_COLLECTION)
        .findOne({ _id: ObjectId(vendorId) })
        .then((vendorDetails) => {
          resolve(vendorDetails);
        });
    });
  },getTotalRevenue: (vendorId) => {
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .aggregate([
          { $unwind: "$orders" },
          { $match:{$and:[ { "orders.productDetails.vendorId": ObjectId(vendorId) },{"orders.status":'placed'}]} },
          {$unwind:"$orders.productDetails"},
          {$match:{"orders.productDetails.cancelled":false}},
          { $project: { orders: 1, _id: 0 } },
        ])
        .toArray();
        let vendor=await db.get().collection(collection.VENDOR_COLLECTION).findOne({_id:ObjectId(vendorId)})
        let balance=await vendor.totalEarnings-vendor.claimedAmount
      let revenue = 0;
      let count = 0;
      for (let oneOrder of orders) {
           revenue = revenue + (oneOrder.orders.productDetails.total*0.9);
           count=count+oneOrder.orders.productDetails.quantity
       }
       
      
      let response = {
        revenue: revenue,
        count: count,
        vendor:vendor,
        balance:balance
      };
      await db.get().collection(collection.VENDOR_COLLECTION).updateOne({_id:ObjectId(vendorId)},
      {$set:{totalEarnings:revenue}})
      resolve(response);
    });
  },redeemRequest:(vendorId,balance,vendor)=>{
    console.log(vendorId);
    return new Promise(async(resolve,reject)=>{
      await db.get().collection(collection.VENDOR_COLLECTION).updateOne({_id:ObjectId(vendorId)},
      {$set:{redeemRequested:true}})
      let redeemRequestDetails={
        requestId:new ObjectId(),
        time:new Date(),
        vendorId:vendorId,
        amount:Number(balance),
        vendor:vendor,
        paymentStatus:false
      }
      await db.get().collection(collection.ADMIN_COLLECTION).updateOne({name:'Arjun'},
      {$push:{redeemRequests:redeemRequestDetails}})
      resolve()
    })
    
  }
};
