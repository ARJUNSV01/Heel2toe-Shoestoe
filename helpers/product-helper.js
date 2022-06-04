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
      addedOn: new Date(),
      title: productDetails.title,
      category: productDetails.category,
      brand: productDetails.brand,
      price: productDetails.price,
      discount: productDetails.discount,
      netprice: (productDetails.price * (100 - productDetails.discount)) / 100,
      // occassion: productDetails.occassion,
      gender: productDetails.gender,
      deleted: false,
    };
    if (products.gender == "kids") {
      products.quantity = {
        threetofour: Number(productDetails.threetofour),
        fourtofive: Number(productDetails.fourtofive),
        fivetosix: Number(productDetails.fivetosix),
        sixtoseven: Number(productDetails.sixtoseven),
        seventoeight: Number(productDetails.seventoeight),
        eighttonine: Number(productDetails.eighttonine),
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
        six: Number(productDetails.six),
        seven: Number(productDetails.seven),
        eight: Number(productDetails.eight),
        nine: Number(productDetails.nine),
        ten: Number(productDetails.ten),
        eleven: Number(productDetails.eleven),
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
      let productDetails = await db
        .get()
        .collection(collection.VENDOR_COLLECTION)
        .aggregate([
          { $unwind: "$products" },
          { $match: { "products._id": ObjectId(productId) } },
          { $project: { products: 1, _id: 0 } },
        ])
        .toArray();
      let reviews = productDetails[0].products.reviews;
      let sum = 0;
      console.log(reviews);
      if (reviews) {
        for (let one of reviews) {
          sum = sum + one.rating;
        }
        let avg = parseInt(sum / reviews.length);
        
        await db.get().collection(collection.VENDOR_COLLECTION).updateOne({'products._id':ObjectId(productId)},
        {$set:{'products.$.avgRating':avg}})
        let avgRating = function (avg) {
          //   if (avg == 1) {
          //     const verypoor = true;
          //     return { verypoor: true };
          //   }
          //   if (avg == 2) {
          //     const poor = true;
          //     return { poor: true };
          //   }
          //   if (avg == 3) {
          //     const normal = true;
          //     return { normal: true };
          //   }
          //   if (avg == 4) {
          //     const good = true;
          //     return { good: true };
          //   }
          //   if (avg == 5) {
          //     const verygood = true;
          //     return { verygood: true };
          //   }
          // };
          switch (avg) {
            case 1:
              return { verypoor: true };
            case 2:
              return { poor: true };
            case 3:
              return { normal: true };
            case 4:
              return { good: true };
            case 5:
              return { verygood: true };
            default:
              break;
          }
        };
        let value = avgRating(avg);
        console.log(value);
        productDetails[0].avgRating = value;
      }
      productDetails[0].reviews = reviews;
      console.log(productDetails[0]);
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
              "products.$.addedOn": new Date(),
              "products.$.title": updatedInfo.title,
              "products.$.category": updatedInfo.category,
              "products.$.brand": updatedInfo.brand,
              "products.$.price": updatedInfo.price,
              "products.$.discount": updatedInfo.discount,
              // "products.$.occassion": updatedInfo.occassion,
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
  submitReviews: (reviews, userId) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: ObjectId(userId) });
      let customerReviews = {
        time: new Date(),
        user: user.firstname,
        userId: userId,
        productId: reviews.productId,
        rating: Number(reviews.star),
        subject: reviews.subject,
        review: reviews.review,
      };
      let response = await db
        .get()
        .collection(collection.VENDOR_COLLECTION)
        .updateOne(
          { "products._id": ObjectId(reviews.productId) },
          { $push: { "products.$.reviews": customerReviews } }
        );
      resolve();
    });
  },
  getLatestProducts: () => {
    return new Promise(async (resolve, reject) => {
      let pro = await db
        .get()
        .collection(collection.VENDOR_COLLECTION)
        .aggregate([
          { $unwind: "$products" },
          { $project: { products: 1, _id: 0 } },
          { $match: { "products.deleted": false } },
          { $sort: { "products.addedOn": -1 } },
          { $limit: 10 },
        ])
        .toArray();
      console.log(true, pro);
      resolve(pro);
    });
  },
  getSortedProducts: (sortBy,gender,category) => {
    return new Promise(async (resolve, reject) => {
      console.log(sortBy);
      console.log(category);
      if(category=='all')
      category=null
      //   if(sort=='addedOn'){
      //  let sortedProducts=await db.get().collection(collection.VENDOR_COLLECTION).aggregate([
      //     {$unwind:'$products'},
      //     {$project:{products:1,_id:0}},
      //     {$sort:{'products.addedOn':1}}
      //   ]).toArray()
      //   console.log(sortedProducts);
      //   resolve(sortedProducts)
      // }
      // if(sort=='netPricelowtohigh'){
      //   let sortedProducts=await db.get().collection(collection.VENDOR_COLLECTION).aggregate([
      //     {$unwind:'$products'},
      //     {$project:{products:1,_id:0}},
      //     {$sort:{'products.netprice':1}}
      //   ]).toArray()
      //   console.log(sortedProducts);
      //   resolve(sortedProducts)
      // }
      // if(sort=='netPricehightolow'){
      //   let sortedProducts=await db.get().collection(collection.VENDOR_COLLECTION).aggregate([
      //     {$unwind:'$products'},
      //     {$project:{products:1,_id:0}},
      //     {$sort:{'products.netprice':-1}}
      //   ]).toArray()
      //   console.log(sortedProducts);
      //   resolve(sortedProducts)
      // }
      // if(sort=='netPricelowtohigh'){
      //   let sortedProducts=await db.get().collection(collection.VENDOR_COLLECTION).aggregate([
      //     {$unwind:'$products'},
      //     {$project:{products:1,_id:0}},
      //     {$sort:{'products.addedOn':1}}
      //   ]).toArray()
      //   console.log(sortedProducts);
      //   resolve(sortedProducts)
      // }
      var sortedProducts;
      switch (sortBy) {
        case "addedOn":
          if(category){
          sortedProducts = await db
            .get()
            .collection(collection.VENDOR_COLLECTION)
            .aggregate([
              { $unwind: "$products" },
              { $project: { products: 1, _id: 0 } },
              {$match:{$and:[{'products.gender':gender},{'products.category':category}]}},
              { $sort: { "products.addedOn": -1 } },
            ])
            .toArray();
          console.log(sortedProducts);
          resolve(sortedProducts);
          }else{
            sortedProducts = await db
            .get()
            .collection(collection.VENDOR_COLLECTION)
            .aggregate([
              { $unwind: "$products" },
              { $project: { products: 1, _id: 0 } },
              {$match:{'products.gender':gender}},
              { $sort: { "products.addedOn": -1 } },
            ])
            .toArray();
          console.log(sortedProducts);
          resolve(sortedProducts);
          }
          break;
        case "netPricelowtohigh":
          if(category){
          sortedProducts = await db
            .get()
            .collection(collection.VENDOR_COLLECTION)
            .aggregate([
              { $unwind: "$products" },
              { $project: { products: 1, _id: 0 } },
               {$match:{$and:[{'products.gender':gender},{'products.category':category}]}},
              { $sort: { "products.netprice": 1 } },
            ])
            .toArray();
          console.log(sortedProducts);
          resolve(sortedProducts);
          }else{
            sortedProducts = await db
            .get()
            .collection(collection.VENDOR_COLLECTION)
            .aggregate([
              { $unwind: "$products" },
              { $project: { products: 1, _id: 0 } },
              {$match:{'products.gender':gender}},
              { $sort: { "products.netprice": 1 } },
            ])
            .toArray();
          console.log(sortedProducts);
          resolve(sortedProducts);
          }
          break;
        case "netPricehightolow":
          if(category){
          sortedProducts = await db
            .get()
            .collection(collection.VENDOR_COLLECTION)
            .aggregate([
              { $unwind: "$products" },
              { $project: { products: 1, _id: 0 } },
              {$match:{$and:[{'products.gender':gender},{'products.category':category}]}},
              { $sort: { "products.netprice": -1 } },
            ])
            .toArray();
          console.log(sortedProducts);
          resolve(sortedProducts);
          }else{
            sortedProducts = await db
            .get()
            .collection(collection.VENDOR_COLLECTION)
            .aggregate([
              { $unwind: "$products" },
              { $project: { products: 1, _id: 0 } },
              {$match:{'products.gender':gender}},
              { $sort: { "products.netprice": -1 } },
            ])
            .toArray();
          console.log(sortedProducts);
          resolve(sortedProducts); 
          }
          break;
        case "rating":
          if(category){
          sortedProducts = await db
            .get()
            .collection(collection.VENDOR_COLLECTION)
            .aggregate([
              { $unwind: "$products" },
              { $project: { products: 1, _id: 0 } },
              {$match:{$and:[{'products.gender':gender},{'products.category':category}]}},
              { $sort: { "products.avgRating": -1 } },
            ])
            .toArray();
          console.log(true, sortedProducts);
          resolve(sortedProducts);
          }else{
            sortedProducts = await db
            .get()
            .collection(collection.VENDOR_COLLECTION)
            .aggregate([
              { $unwind: "$products" },
              { $project: { products: 1, _id: 0 } },
              {$match:{'products.gender':gender}},
              { $sort: { "products.avgRating": -1 } },
            ])
            .toArray();
          console.log(true, sortedProducts);
          resolve(sortedProducts);
          }
          break;

        default:
          break;
      }
    });
  },shopByCategory:(category,gender)=>{
    console.log(category);
    return new Promise(async(resolve,reject)=>{
    if(category =='all'){
      let products=await db.get().collection(collection.VENDOR_COLLECTION).aggregate([
        {$unwind:'$products'},
        {$project:{products:1,_id:0}},
        {$match:{'products.gender':gender}},

      ]).toArray()
      resolve(products)
    
      }else{
        let products=await db.get().collection(collection.VENDOR_COLLECTION).aggregate([
          {$unwind:'$products'},
          {$project:{products:1,_id:0}},
          {$match:{$and:[{'products.gender':gender},{'products.category':category}]}},

        ]).toArray()
        resolve(products)
        
      } 
        
    })
  },
  shopByBrands:(brand,category,gender)=>{
    brand=brand.toUpperCase()
    if(category=='all')
    category=null
    return new Promise(async(resolve,reject)=>{
      if(category){
      let products=await db.get().collection(collection.VENDOR_COLLECTION).aggregate([
        {$unwind:'$products'},
        {$project:{products:1,_id:0}},
        {$match:{$and:[{'products.gender':gender},{'products.category':category},{'products.brand':brand}]}}
      ]).toArray()
      console.log(products);
      resolve(products)
    }else{
      let products=await db.get().collection(collection.VENDOR_COLLECTION).aggregate([
        {$unwind:'$products'},
        {$project:{products:1,_id:0}},
        {$match:{$and:[{'products.gender':gender},{'products.brand':brand}]}}
      ]).toArray()
      console.log(products);
      resolve(products)
    }
    })
  }
























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
