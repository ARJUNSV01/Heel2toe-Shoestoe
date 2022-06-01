/* eslint-disable no-unused-vars */
/* eslint-disable no-async-promise-executor */
const db = require("../config/connection");
const collection = require("../config/collections");
const { ObjectId, Collection } = require("mongodb");
const Razorpay = require("razorpay");
const { resolve } = require("path");
const { log } = require("console");
var instance = new Razorpay({
  key_id: "rzp_test_i7RAxm8pu7Dno0",
  key_secret: "Um4oamHTKqJ3i9ucFTa4uez2",
});

module.exports = {
  placeOrder: (user, address, cart) => {
    console.log(true, cart);
    return new Promise(async (resolve, reject) => {
      const UserAddress = {
        house: address.home,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        phonenumber: address.phonenumber,
      };
      let status = address.modeofpayment === "cod" ? "placed" : "pending";
      let OrderObj = {
        orderId: new ObjectId(),
        time: new Date(),
        productDetails: cart,
        deliveryDetails: {
          mobile: address.phonenumber,
          house: address.home,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
        },
        modeOfPayment: address.modeofpayment,
        status: status,
        totalAmount: cart.cartPriceInfo.sumtotal,
      };
      let orderId = OrderObj.orderId;
      let totalAmount = OrderObj.totalAmount;
      await db
        .get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: ObjectId(user._id) },
          {
            $set: {
              Address: UserAddress,
            },
            $push: { orders: OrderObj },
          },
          { upsert: true }
        );

      let response = {
        orderId: orderId,
        totalAmount: totalAmount,
      };
      resolve(response);
    });
  },
  getCart: (userId) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: ObjectId(userId) });
      let cart = user.cart;
      let sumtotal = 0;
      let MRPtotal = 0;

      for (let oneCart of cart) {
        sumtotal = oneCart.total + sumtotal;
        MRPtotal = oneCart.totalMRP + MRPtotal;
      }

      let cartPriceInfo = {
        MRPtotal: MRPtotal,
        sumtotal: sumtotal,
        discount: MRPtotal - sumtotal,
      };
      cart.cartPriceInfo = cartPriceInfo;

      resolve(cart);
    });
  },

  generateRazorpay: (details) => {
    return new Promise((resolve, reject) => {
      // instance.orders.create({
      //     amount: details.totalAmount,
      //     currency: "INR",
      //     receipt: details.orderId,
      //     notes: {
      //       key1: "value3",
      //       key2: "value2"
      //     }
      //   })
      let totalamount = parseInt(details.totalAmount);
      console.log(totalamount);
      var options = {
        amount: totalamount * 100,
        currency: "INR",
        receipt: "" + details.orderId,
      };
      instance.orders.create(options, function (err, order) {
        if (err) {
          console.log(err);
        }
        // console.log("New Order :",order);
        resolve(order);
      });
    });
  },
  verifyPayment: (details) => {
    return new Promise((resolve, reject) => {
      const crypto = require("crypto");
      let hmac = crypto.createHmac("sha256", "Um4oamHTKqJ3i9ucFTa4uez2");
      hmac.update(
        details["payment[razorpay_order_id]"] +
          "|" +
          details["payment[razorpay_payment_id]"]
      );
      hmac = hmac.digest("hex");
      if (hmac == details["payment[razorpay_signature]"]) {
        resolve();
      } else {
        reject();
      }
    });
  },
  changePaymentStatus: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let response = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { "orders.orderId": ObjectId(orderId) },
          {
            $set: {
              "orders.$.status": "placed",
            },
          }
        );
      // console.log(response);
      resolve();
    });
  },
  // changeQtyAfterOrder:(userId)=>{
  //     return new Promise(async(resolve,reject)=>{
  //    const cart = await db.get().collection(collection.USER_COLLECTION).aggregate([
  //        {$match:{_id:ObjectId(userId)}},
  //        {$unwind:'$cart'},
  //        {$project:{'cart.productId':1,'cart.quantity':1,'cart.size':1}}
  //    ]).toArray()
  //    console.log('hi');
  //    console.log(cart);
  //    for(let one of cart){
  //     let productId=one.cart.productId
  //     let quantity=one.cart.quantity
  //     let Size=one.cart.size
  //     let x=await db.get().collection(collection.VENDOR_COLLECTION).aggregate([

  //         {$unwind:'$products'},
  //         {$match:{'products._id':ObjectId(productId)}},
  //         // {$project:{products:1,_id:0}},
  //     // {$unwind:'$products.sizesAvailable'},
  //     // {$project:{'products.sizesAvailable':1}},
  //     {$match:{'products.sizesAvailable.size':'seven'}},
  //     {$unwind:'$products.sizesAvailable'},
  //     {$project:{'products.sizesAvailable.size':1,'products.sizesAvailable.qty':1,'products._id':1,_id:0}}
  //     ]).toArray()
  //     console.log(true);
  //     console.log('hellooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo');
  //     console.log(x)

  //     // for(let y of x){
  //     //     if(y.products.sizesAvailable.size==size && y.products._id==ObjectId(productId)){
  //     //        console.log('ko');
  //     //         // y.products.sizesAvailable.qty=90
  //     //         // console.log(y.products.sizesAvailable.qty)
  //     //     }
  //     // }
  //     let b= x.find((person)=>{
  //         return (person.products.sizesAvailable.size==Size)
  //     })
  //        console.log(b);

  //     b.products.sizesAvailable.qty=b.products.sizesAvailable.qty-quantity
  //     console.log(b.products.sizesAvailable.qty);
  //     const sizesAvailable={
  //         size:b.products.sizesAvailable.size,
  //         qty:b.products.sizesAvailable.qty
  //     }
  //     console.log('hola',sizesAvailable);
  //     let z =await db.get().collection(collection.VENDOR_COLLECTION).updateOne({$and:[{'products._id':ObjectId(productId)},{'products.sizesAvailable.size':Size}]},
  //     {$set:{'products.$.sizesAvailable.qty':3}}
  //     )
  //     console.log(z);
  //    }
  //     })
  // }

  changeQtyAfterOrder: (userId) => {
    return new Promise(async (resolve, reject) => {
      const cart = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .aggregate([
          { $match: { _id: ObjectId(userId) } },
          { $unwind: "$cart" },
          {
            $project: {
              "cart.productId": 1,
              "cart.quantity": 1,
              "cart.size": 1,
            },
          },
        ])
        .toArray();
      console.log("hi");
      console.log(cart);
      for (let one of cart) {
        let productId = one.cart.productId;
        let quantity = one.cart.quantity;
        let Size = one.cart.size;
        if (Size == "six")
          await db
            .get()
            .collection(collection.VENDOR_COLLECTION)
            .updateOne(
              { "products._id": ObjectId(productId) },
              { $inc: { "products.$.quantity.six": -quantity } }
            );
        if (Size == "seven")
          await db
            .get()
            .collection(collection.VENDOR_COLLECTION)
            .updateOne(
              { "products._id": ObjectId(productId) },
              { $inc: { "products.$.quantity.seven": -quantity } }
            );
        if (Size == "eight")
          await db
            .get()
            .collection(collection.VENDOR_COLLECTION)
            .updateOne(
              { "products._id": ObjectId(productId) },
              { $inc: { "products.$.quantity.eight": -quantity } }
            );
        if (Size == "nine")
          await db
            .get()
            .collection(collection.VENDOR_COLLECTION)
            .updateOne(
              { "products._id": ObjectId(productId) },
              { $inc: { "products.$.quantity.nine": -quantity } }
            );
        if (Size == "ten")
          await db
            .get()
            .collection(collection.VENDOR_COLLECTION)
            .updateOne(
              { "products._id": ObjectId(productId) },
              { $inc: { "products.$.quantity.ten": -quantity } }
            );
        if (Size == "eleven")
          await db
            .get()
            .collection(collection.VENDOR_COLLECTION)
            .updateOne(
              { "products._id": ObjectId(productId) },
              { $inc: { "products.$.quantity.eleven": -quantity } }
            );
        if (Size == "3-4")
          await db
            .get()
            .collection(collection.VENDOR_COLLECTION)
            .updateOne(
              { "products._id": ObjectId(productId) },
              { $inc: { "products.$.quantity.threetofour": -quantity } }
            );
        if (Size == "4-5")
          await db
            .get()
            .collection(collection.VENDOR_COLLECTION)
            .updateOne(
              { "products._id": ObjectId(productId) },
              { $inc: { "products.$.quantity.fourtofive": -quantity } }
            );
        if (Size == "5-6")
          await db
            .get()
            .collection(collection.VENDOR_COLLECTION)
            .updateOne(
              { "products._id": ObjectId(productId) },
              { $inc: { "products.$.quantity.fivetosix": -quantity } }
            );
        if (Size == "6-7")
          await db
            .get()
            .collection(collection.VENDOR_COLLECTION)
            .updateOne(
              { "products._id": ObjectId(productId) },
              { $inc: { "products.$.quantity.sixtoseven": -quantity } }
            );
        if (Size == "7-8")
          await db
            .get()
            .collection(collection.VENDOR_COLLECTION)
            .updateOne(
              { "products._id": ObjectId(productId) },
              { $inc: { "products.$.quantity.seventoeight": -quantity } }
            );
        if (Size == "8-9")
          await db
            .get()
            .collection(collection.VENDOR_COLLECTION)
            .updateOne(
              { "products._id": ObjectId(productId) },
              { $inc: { "products.$.quantity.eighttonine": -quantity } }
            );
      }
      resolve();
    });
  },
  getOrderDetails: (userId) => {
    return new Promise(async(resolve,reject)=>{
    let user = await db.get().collection(collection.USER_COLLECTION).findOne({_id:ObjectId(userId)})
    let orders = user.orders
    resolve(orders)
    });
  },
  getOrderedProducts:(orderId)=>{
      return new Promise(async(resolve,reject)=>{
          let order= await db.get().collection(collection.USER_COLLECTION).aggregate([
              {$match:{'orders.orderId':ObjectId(orderId)}},
              {$unwind:'$orders'},
              {$match:{'orders.orderId':ObjectId(orderId)}},
              {$project:{orders:1,_id:0}}
          ]).toArray()
          resolve(order[0].orders)
      })
  },viewOrders:(vendorId)=>{
      return new Promise(async(resolve,reject)=>{
        console.log(vendorId);
       let x = await  db.get().collection(collection.USER_COLLECTION).aggregate([
          {$unwind:'$orders'},
          {$match:{'orders.productDetails.vendorId':ObjectId(vendorId)}},
          
         ]).toArray()
         resolve(x)
      })
  }
};
