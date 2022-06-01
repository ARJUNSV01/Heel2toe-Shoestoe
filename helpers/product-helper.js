/* eslint-disable no-unused-vars */
/* eslint-disable no-async-promise-executor */
const { ObjectId } = require("mongodb");
const { reject } = require("bcrypt/promises");
const db = require("../config/connection");
const collection = require("../config/collections");

module.exports = {
  viewProducts: (vendorData) =>
    new Promise(async (resolve, reject) => {
      const products = await db
        .get()
        .collection(collection.VENDOR_COLLECTION)
        .aggregate([
          { $match: { email: vendorData.email } },
          { $unwind: "$products" },
          { $match: { "products.deleted": false } },
          { $project: { products: 1, _id: 0 } },
        ])
        .toArray();

      resolve(products);
    }),

  addProducts: (productDetails, vendorId) => {
    // console.log(productDetails);
    const products = {
      _id: new ObjectId(),
      title: productDetails.title,
      category: productDetails.category,
      brand: productDetails.brand,
      price: productDetails.price,
      discount: productDetails.discount,
      netprice: (productDetails.price * (100 - productDetails.discount)) / 100,
      occassion: productDetails.occassion,
      gender: productDetails.gender,
      deleted: false,
    };
    if (products.gender == "kids") {
      products.quantity = {
        threetofour: productDetails.threetofour,
        fourtofive: productDetails.fourtofive,
        fivetosix: productDetails.fivetosix,
        sixtoseven: productDetails.sixtoseven,
        seventoeight: productDetails.seventoeight,
        eighttonine: productDetails.eighttonine,
      };
      products.sizesAvailable = [
        { size: "threetofour", qty: Number(productDetails.six) },
        { size: "fourtofive", qty: Number(productDetails.seven) },
        { size: "fivetosix", qty: Number(productDetails.eight) },
        { size: "sixtoseven", qty: Number(productDetails.nine) },
        { size: "seventoeight", qty: Number(productDetails.ten) },
        { size: "eighttonine", qty: Number(productDetails.eleven) },
      ];
    } else {
      products.quantity = {
        six: productDetails.six,
        seven: productDetails.seven,
        eight: productDetails.eight,
        nine: productDetails.nine,
        ten: productDetails.ten,
        eleven: productDetails.eleven,
        twelve: productDetails.twelve,
        thirteen: productDetails.thirteen,
        fourteen: productDetails.fourteen,
      };
      products.sizesAvailable = [
        { size: "six", qty: Number(productDetails.six) },
        { size: "seven", qty: Number(productDetails.seven) },
        { size: "eight", qty: Number(productDetails.eight) },
        { size: "nine", qty: Number(productDetails.nine) },
        { size: "ten", qty: Number(productDetails.ten) },
        { size: "eleven", qty: Number(productDetails.eleven) },
      ];
    }
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.VENDOR_COLLECTION)
        .updateOne(
          { _id: ObjectId(vendorId) },
          {
            $push: {
              products,
            },
          },
          { upsert: true }
        );

      resolve(products._id);
    });
  },
  deleteProducts: (vendorId, productId) => {
    console.log(vendorId);
    return new Promise(async (resolve, reject) => {
      const data = await db
        .get()
        .collection(collection.VENDOR_COLLECTION)
        .updateOne(
          { "products._id": ObjectId(productId) },
          { $set: { "products.$.deleted": true } }
        );
      resolve();
    });
  },
  getProductDetails: (productId) =>
    new Promise(async (resolve, reject) => {
      const productDetails = await db
        .get()
        .collection(collection.VENDOR_COLLECTION)
        .aggregate([
          { $unwind: "$products" },
          { $match: { "products._id": ObjectId(productId) } },
          { $project: { products: 1, _id: 0 } },
        ])
        .toArray();
      resolve(productDetails[0]);
    }),
  updateProduct: (productId, updatedInfo) =>
    new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.VENDOR_COLLECTION)
        .updateOne(
          { "products._id": ObjectId(productId) },
          {
            $set: {
              "products.$.title": updatedInfo.title,
              "products.$.category": updatedInfo.category,
              "products.$.brand": updatedInfo.brand,
              "products.$.price": updatedInfo.price,
              "products.$.discount": updatedInfo.discount,
              "products.$.occassion": updatedInfo.occassion,
              "products.$.gender": updatedInfo.gender,
              "products.$.netprice":
                (updatedInfo.price * (100 - updatedInfo.discount)) / 100,
              "products.$.sizesAvailable": [
                { size: "threetofour", qty: Number(updatedInfo.six) },
                { size: "fourtofive", qty: Number(updatedInfo.seven) },
                { size: "fivetosix", qty: Number(updatedInfo.eight) },
                { size: "sixtoseven", qty: Number(updatedInfo.nine) },
                { size: "seventoeight", qty: Number(updatedInfo.ten) },
                { size: "eighttonine", qty: Number(updatedInfo.eleven) },
              ],
            },
          }
        );
      if (updatedInfo.gender == "kids") {
        await db
          .get()
          .collection(collection.VENDOR_COLLECTION)
          .updateOne(
            { "products._id": ObjectId(productId) },
            {
              $set: {
                "products.$.quantity.threetofour": Number(
                  updatedInfo.threetofour
                ),
                "products.$.quantity.fourtofive": Number(
                  updatedInfo.fourtofive
                ),
                "products.$.quantity.fivetosix": Number(updatedInfo.fivetosix),
                "products.$.quantity.sixtoseven": Number(
                  updatedInfo.sixtoseven
                ),
                "products.$.quantity.seventoeight": Number(
                  updatedInfo.seventoeight
                ),
                "products.$.quantity.eighttonine": Number(
                  updatedInfo.eighttonine
                ),
              },
            }
          );
      } else {
        await db
          .get()
          .collection(collection.VENDOR_COLLECTION)
          .updateOne(
            { "products._id": ObjectId(productId) },
            {
              $set: {
                "products.$.quantity.six": Number(updatedInfo.six),
                "products.$.quantity.seven": Number(updatedInfo.seven),
                "products.$.quantity.eight": Number(updatedInfo.eight),
                "products.$.quantity.nine": Number(updatedInfo.nine),
                "products.$.quantity.ten": Number(updatedInfo.ten),
                "products.$.quantity.eleven": Number(updatedInfo.eleven),
                "products.$.sizesAvailable": [
                  { size: "six", qty: Number(updatedInfo.six) },
                  { size: "seven", qty: Number(updatedInfo.seven) },
                  { size: "eight", qty: Number(updatedInfo.eight) },
                  { size: "nine", qty: Number(updatedInfo.nine) },
                  { size: "ten", qty: Number(updatedInfo.ten) },
                  { size: "eleven", qty: Number(updatedInfo.eleven) },
                ],
              },
            }
          );
      }

      resolve();
    }), // user-product-helper functions

  shoppingViewProducts: (gender) =>
    new Promise(async (resolve, reject) => {
      const menProducts = await db
        .get()
        .collection(collection.VENDOR_COLLECTION)
        .aggregate([
          { $unwind: "$products" },
          {
            $match: {
              $and: [
                { "products.gender": gender },
                { "products.deleted": false },
              ],
            },
          },

          { $project: { products: 1, _id: 0 } },
        ])
        .toArray();
      resolve(menProducts);
    }),
  // addToCart: (size, productid, userId) => new Promise(async (resolve, reject) => {
  //   console.log(userId);
  //   const product = await db.get().collection(collection.USER_COLLECTION).aggregate([
  //     { $match: { _id: ObjectId(userId) } },
  //     { $unwind: '$cart' },
  //     { $project: { cart: 1, _id: 0 } },

  //   ]).toArray();
  //   console.log(ObjectId(productid));
  //   for (const oneCart of product) {
  //     if (oneCart.cart.productId === productid && oneCart.cart.size === size) {
  //       oneCart.cart.quantity = oneCart.cart.quantity + 1;
  //       await db.get().collection(collection.USER_COLLECTION).updateOne(
  //         { 'cart._id': oneCart.cart._id },
  //         {
  //           $set:
  //                       {
  //                         'cart.$.quantity': oneCart.cart.quantity,
  //                       },
  //         },

  //       );
  //       resolve();
  //     }
  //   }

  //   reject(productid);
  // }),
  // viewCart: (userId) => new Promise(async (resolve, reject) => {
  //   const cart = await db.get().collection(collection.USER_COLLECTION).aggregate([
  //     { $match: { _id: ObjectId(userId) } },
  //     { $unwind: '$cart' },
  //     { $project: { cart: 1, _id: 0 } },
  //   ]).toArray();
  //   console.log('hi');
  //   resolve(cart)

  // }),
};
