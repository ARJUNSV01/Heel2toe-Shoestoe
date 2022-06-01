/* eslint-disable no-unused-vars */
/* eslint-disable no-async-promise-executor */
var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
const Logger = require("nodemon/lib/utils/log");
const { promise } = require("bcrypt/promises");
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
};
