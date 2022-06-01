/* eslint-disable no-unused-vars */
/* eslint-disable no-async-promise-executor */
const db = require("../config/connection");
const collection = require("../config/collections");
const { ObjectId } = require("mongodb");
const { reject } = require("bcrypt/promises");

module.exports = {
  addToCart: (size, productid, userId) =>
    new Promise(async (resolve, reject) => {
      console.log(userId);
      const product = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .aggregate([
          { $match: { _id: ObjectId(userId) } },
          { $unwind: "$cart" },
          { $project: { cart: 1, _id: 0 } },
        ])
        .toArray();
      console.log(ObjectId(productid));
      for (const oneCart of product) {
        if (
          oneCart.cart.productId === productid &&
          oneCart.cart.size === size
        ) {
          oneCart.cart.quantity = oneCart.cart.quantity + 1;
          await db
            .get()
            .collection(collection.USER_COLLECTION)
            .updateOne(
              { "cart.cartId": oneCart.cart.cartId },
              {
                $set: {
                  "cart.$.quantity": oneCart.cart.quantity,
                  "cart.$.total": oneCart.cart.quantity * oneCart.cart.netprice,
                  "cart.$.totalMRP": oneCart.cart.quantity * oneCart.cart.price,
                },
              }
            );
          resolve();
        }
      }
      reject(productid);
    }),
  viewCart: (userId) =>
    new Promise(async (resolve) => {
      const cart = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .aggregate([
          { $match: { _id: ObjectId(userId) } },
          { $unwind: "$cart" },
          { $project: { cart: 1, _id: 0 } },
        ])
        .toArray();
      let sumtotal = 0;
      let MRPtotal = 0;

      for (let oneCart of cart) {
        sumtotal = oneCart.cart.total + sumtotal;
        MRPtotal = oneCart.cart.totalMRP + MRPtotal;
      }

      let cartPriceInfo = {
        MRPtotal: MRPtotal,
        sumtotal: sumtotal,
        discount: MRPtotal - sumtotal,
      };
      cart.cartPriceInfo = cartPriceInfo;
      resolve(cart);
    }),
  deleteItem: (cartId) => {
    console.log(cartId);
    return new Promise(async (resolve) => {
      await db
        .get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { "cart.cartId": ObjectId(cartId) },
          { $pull: { cart: { cartId: ObjectId(cartId) } } }
        );
      resolve();
    });
  },
  clearCart: (user) => {
    console.log(user._id);
    return new Promise(async (resolve) => {
      await db
        .get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: ObjectId(user._id) },
          { $pull: { cart: { quantity: { $lt: 10 } } } }
        );
      resolve();
    });
  },
  addQty: (cartId) => {
    return new Promise(async (resolve) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ "cart.cartId": ObjectId(cartId) });
      let index = user.cart.findIndex((prod) => prod.cartId == cartId);
      let selectedCart = user.cart[index];
      await db
        .get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { "cart.cartId": ObjectId(cartId) },
          {
            $inc: {
              "cart.$.quantity": +1,
            },
            $set: {
              "cart.$.total":
                (selectedCart.quantity + 1) * selectedCart.netprice,
              "cart.$.totalMRP":
                (selectedCart.quantity + 1) * selectedCart.price,
            },
          }
        );
      resolve();
    });
  },
  subQty: (cartId) => {
    return new Promise(async (resolve) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ "cart.cartId": ObjectId(cartId) });
      let index = await user.cart.findIndex((prod) => prod.cartId == cartId);
      var selectedCart = user.cart[index];
      if (user.cart[index].quantity === 1) {
        await db
          .get()
          .collection(collection.USER_COLLECTION)
          .updateOne(
            { "cart.cartId": ObjectId(cartId) },
            { $pull: { cart: { cartId: ObjectId(cartId) } } }
          );
      } else {
        await db
          .get()
          .collection(collection.USER_COLLECTION)
          .updateOne(
            { "cart.cartId": ObjectId(cartId) },
            {
              $inc: {
                "cart.$.quantity": -1,
              },
              $set: {
                "cart.$.total":
                  (selectedCart.quantity - 1) * selectedCart.netprice,
                "cart.$.totalMRP":
                  (selectedCart.quantity - 1) * selectedCart.price,
              },
            }
          );
      }
      resolve();
    });
  },
};
