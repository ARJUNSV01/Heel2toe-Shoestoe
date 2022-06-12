/* eslint-disable no-unused-vars */
/* eslint-disable no-async-promise-executor */
var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
const Logger = require("nodemon/lib/utils/log");
const { promise, reject } = require("bcrypt/promises");
const { ObjectId } = require("mongodb");
module.exports = {
  // adminlogin:(adminData)=>{
  //     return new Promise(async (resolve,reject)=>{
  //       let admin=await db.get().collection(collection.ADMIN_COLLECTION).findOne({email:adminData.email})
  //       if(admin){
  //           bcrypt.compare(adminData.password,admin.password).then((status)=>{
  //               resolve(status)
  //               console.log('login success');
  //           })
  //       }else{
  //           console.log('login failed');
  //           resolve(false)
  //       }
  //     })
  // }

  adminLogin: (adminData) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let admin = await db
        .get()
        .collection(collection.ADMIN_COLLECTION)
        .findOne({ email: adminData.email });
      if (admin) {
        bcrypt.compare(adminData.password, admin.password).then((status) => {
          if (status) {
            response.admin = admin;
            response.status = true;
            resolve(response);
          } else {
            resolve({ status: false });
          }
        });
      } else {
        resolve({ status: false });
      }
    });
  },
  getAllUsers: () => {
    return new Promise(async (resolve, reject) => {
      let users = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .find()
        .toArray();
      resolve(users);
    });
  },
  deleteUser: (userId) => {
    return new Promise(async (resolve, reject) => {
      let response = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .deleteOne({ _id: ObjectId(userId) });
      resolve(response);
    });
  },
  blockUser: (userId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.USER_COLLECTION)
        .updateOne({ _id: ObjectId(userId) }, { $set: { isActive: false } });
      let response = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: ObjectId(userId) });
      resolve(response);
    });
  },
  unBlockUser: (userId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.USER_COLLECTION)
        .updateOne({ _id: ObjectId(userId) }, { $set: { isActive: true } });
      let response = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: ObjectId(userId) });
      resolve(response);
    });
  },
  getAllVendors:()=>{
    return new Promise(async(resolve,reject)=>{
    let vendors =  await db.get().collection(collection.VENDOR_COLLECTION).find().toArray()
    console.log(vendors);
    resolve(vendors)
    })
  },
  getVendor:(vendorId)=>{
    return new Promise (async(resolve,reject)=>{
      let vendor=await db.get().collection(collection.VENDOR_COLLECTION).findOne({_id:ObjectId(vendorId)})
      resolve(vendor)
    })
  },
  blockVendor: (vendorId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.VENDOR_COLLECTION)
        .updateOne({ _id: ObjectId(vendorId) }, { $set: { isActive: false } });
      let response = await db
        .get()
        .collection(collection.VENDOR_COLLECTION)
        .findOne({ _id: ObjectId(vendorId) });
      resolve(response);
    });
  },
  unBlockVendor: (vendorId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.VENDOR_COLLECTION)
        .updateOne({ _id: ObjectId(vendorId) }, { $set: { isActive: true } });
      let response = await db
        .get()
        .collection(collection.VENDOR_COLLECTION)
        .findOne({ _id: ObjectId(vendorId) });
      resolve(response);
    });
  },
  totalRevenue:()=>{
    return new Promise(async(resolve,reject)=>{
     let products = await db.get().collection(collection.USER_COLLECTION).aggregate([
        {$unwind:'$orders'},
        {$match:{'orders.status':'placed'}},
        {$unwind:'$orders.productDetails'},
        {$match:{'orders.productDetails.cancelled':false}},
        {$project:{'orders.productDetails':1,_id:0}},
        
      ]).toArray()
      console.log(products[0].orders)
      let revenue=0,count=0,profit=0
     
      for(let oneProduct of products){
      revenue=revenue+(oneProduct.orders.productDetails.total)
        count++
        profit+=oneProduct.orders.productDetails.total*0.1
      }
     
      
      let response = {
        revenue: revenue,
        count:count,
        profit
      };
      resolve(response);
    })
  },viewRedeemRequests:()=>{
    return new Promise(async(resolve,reject)=>{
      let admin=await db.get().collection(collection.ADMIN_COLLECTION).findOne({})
      let requests=admin.redeemRequests
      resolve(requests)
    })
  },payAmount:(vendorId,amount,requestId)=>{
return new Promise(async(resolve,reject)=>{
await db.get().collection(collection.VENDOR_COLLECTION).updateOne({_id:ObjectId(vendorId)},
{$inc:{claimedAmount:Number(amount)},
$set:{redeemRequested:false}})
 await db.get().collection(collection.ADMIN_COLLECTION).updateOne({'redeemRequests.requestId':ObjectId(requestId)},
  {$set:{'redeemRequests.$.paymentStatus':true,'redeemRequests.$.paymentId':new ObjectId(),'redeemRequests.$.paidOn':new Date()}},{upsert:true})
  resolve()
 })
  },requestsCount:()=>{
    return new Promise(async(resolve,reject)=>{
      let requests=await db.get().collection(collection.ADMIN_COLLECTION).aggregate([
        {$unwind:'$redeemRequests'},
        {$match:{'redeemRequests.paymentStatus':false}},
        {$project:{redeemRequests:1,_id:0}}
      ]).toArray()
      console.log(requests);
     let count=requests.length
      resolve(count)
    })
  }
};
