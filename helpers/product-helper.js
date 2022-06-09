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

          { $project: { products: 1, _id: 0 } },
        ])
        .toArray();

      resolve(products);
    }),

  addProducts: (productDetails, vendorId) => {
    console.log(productDetails);
    const products = {
      _id: new ObjectId(),
      addedOn: new Date(),
      title: productDetails.title,
      category: productDetails.category,
      brand: productDetails.brand,
      price: productDetails.price,
      discount: productDetails.discount,
      netprice: (productDetails.price * (100 - productDetails.discount)) / 100,
      description: productDetails.description,
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
      let check = await db
        .get()
        .collection(collection.VENDOR_COLLECTION)
        .aggregate([
          { $unwind: "$products" },
          { $match: { "products._id": ObjectId(productId) } },
          { $project: { products: 1, _id: 0 } },
        ])
        .toArray();
      check = check[0].products.deleted;
      if (check) {
        const data = await db
          .get()
          .collection(collection.VENDOR_COLLECTION)
          .updateOne(
            { "products._id": ObjectId(productId) },
            { $set: { "products.$.deleted": false } }
          );
        resolve();
      } else {
        const data = await db
          .get()
          .collection(collection.VENDOR_COLLECTION)
          .updateOne(
            { "products._id": ObjectId(productId) },
            { $set: { "products.$.deleted": true } }
          );
        resolve();
      }
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

        await db
          .get()
          .collection(collection.VENDOR_COLLECTION)
          .updateOne(
            { "products._id": ObjectId(productId) },
            { $set: { "products.$.avgRating": avg } }
          );
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
              "products.$.description": updatedInfo.description,
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
  getBrands: () => {
    return new Promise(async (resolve, reject) => {
      let brands = await db
        .get()
        .collection(collection.VENDOR_COLLECTION)
        .aggregate([
          { $unwind: "$products" },
          { $group: { _id: { x: "$products.brand" } } },
        ])
        .toArray();
      console.log(true, brands);
      resolve(brands);
    });
  },
  getCategories: () => {
    return new Promise(async (resolve, reject) => {
      let categories = await db
        .get()
        .collection(collection.VENDOR_COLLECTION)
        .aggregate([
          { $unwind: "$products" },
          { $group: { _id: { y: "$products.category" } } },
        ])
        .toArray();
      console.log(true, categories);
      resolve(categories);
    });
  },

  filterProducts: (brandFilter, catFilter, gender,search) => {
    return new Promise(async (resolve, reject) => {
      console.log('ajskjakjbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
      if(!search){
      if (catFilter.length > 1 && brandFilter.length > 1) {
        let result = await db
          .get()
          .collection(collection.VENDOR_COLLECTION)
          .aggregate([
            {
              $unwind: "$products",
            },
            {
              // $match: { $or: filter }
              $match: { $and: [{ $or: brandFilter }, { $or: catFilter }] },
            },
            {
              $match: {
                $and: [
                  { "products.gender": gender },
                  { "products.deleted": false },
                ],
              },
            },
            {
              $project: { products: 1, _id: 0 },
            },
          ])
          .toArray();
        console.log(result);
        resolve(result);
      }
      if (brandFilter.length > 1) {
        let result = await db
          .get()
          .collection(collection.VENDOR_COLLECTION)
          .aggregate([
            {
              $unwind: "$products",
            },
            {
              $match: { $or: brandFilter },
            },
            {
              $match: {
                $and: [
                  { "products.gender": gender },
                  { "products.deleted": false },
                ],
              },
            },
            {
              $project: { products: 1, _id: 0 },
            },
          ])
          .toArray();
        // console.log(3984989489348934893489394394398493);
        console.log(result);
        resolve(result);
      }
      if (catFilter.length > 1) {
        let result = await db
          .get()
          .collection(collection.VENDOR_COLLECTION)
          .aggregate([
            {
              $unwind: "$products",
            },
            {
              $match: { $or: catFilter },
            },
            {
              $match: {
                $and: [
                  { "products.gender": gender },
                  { "products.deleted": false },
                ],
              },
            },
            {
              $project: { products: 1, _id: 0 },
            },
          ])
          .toArray();
        // console.log(3984989489348934893489394394398493);
        console.log(result);
        resolve(result);
      } else {
        const result = await db
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
        resolve(result);
      }
      }else{

        if (catFilter.length > 1 && brandFilter.length > 1) {
          let result = await db
            .get()
            .collection(collection.VENDOR_COLLECTION)
            .aggregate([
              {
                $project: {
                  _id: 0,
                  products: {
                    $filter: {
                      input: "$products",
                      as: "products",
                      cond: {
                        $or: [
                          {
                            $regexMatch: {
                              input: "$$products.brand",
                              regex: search,
                              options: "i",
                            },
                          },
                          {
                            $regexMatch: {
                              input: "$$products.title",
                              regex: search,
                              options: "i",
                            },
                          },
                          {
                            $regexMatch: {
                              input: "$$products.category",
                              regex: search,
                              options: "i",
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              },
              {
                $unwind: "$products",
              },
              {
                // $match: { $or: filter }
                $match: { $and: [{ $or: brandFilter }, { $or: catFilter }] },
              },
              {
                $match: 
                    
                    { "products.deleted": false },
                
                
              },
              {
                $project: { products: 1, _id: 0 },
              },
            ])
            .toArray();
          console.log(result);
          resolve(result);
        }
        if (brandFilter.length > 1) {
        console.log('hialla');
          let result = await db
            .get()
            .collection(collection.VENDOR_COLLECTION)
            .aggregate([
              {
                $project: {
                  _id: 0,
                  products: {
                    $filter: {
                      input: "$products",
                      as: "products",
                      cond: {
                        $or: [
                          {
                            $regexMatch: {
                              input: "$$products.brand",
                              regex: search,
                              options: "i",
                            },
                          },
                          {
                            $regexMatch: {
                              input: "$$products.title",
                              regex: search,
                              options: "i",
                            },
                          },
                          {
                            $regexMatch: {
                              input: "$$products.category",
                              regex: search,
                              options: "i",
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              },
              {
                $unwind: "$products",
              },
              {
                $match: { $or: brandFilter },
              },
              {
                $match: 
                    { "products.deleted": false },
               
              },
              {
                $project: { products: 1, _id: 0 },
              },
            ])
            .toArray();
          // console.log(3984989489348934893489394394398493);
          console.log(result);
          resolve(result);
        }
        if (catFilter.length > 1) {
          let result = await db
            .get()
            .collection(collection.VENDOR_COLLECTION)
            .aggregate([
              {
                $project: {
                  _id: 0,
                  products: {
                    $filter: {
                      input: "$products",
                      as: "products",
                      cond: {
                        $or: [
                          {
                            $regexMatch: {
                              input: "$$products.brand",
                              regex: search,
                              options: "i",
                            },
                          },
                          {
                            $regexMatch: {
                              input: "$$products.title",
                              regex: search,
                              options: "i",
                            },
                          },
                          {
                            $regexMatch: {
                              input: "$$products.category",
                              regex: search,
                              options: "i",
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              },
              {
                $unwind: "$products",
              },
              {
                $match: { $or: catFilter },
              },
              {
                $match: 
                    { "products.deleted": false },
                 
              },
              {
                $project: { products: 1, _id: 0 },
              },
            ])
            .toArray();
          // console.log(3984989489348934893489394394398493);
          console.log(result);
          resolve(result);
        } else {
          const result = await db
            .get()
            .collection(collection.VENDOR_COLLECTION)
            .aggregate([
              {
                $project: {
                  _id: 0,
                  products: {
                    $filter: {
                      input: "$products",
                      as: "products",
                      cond: {
                        $or: [
                          {
                            $regexMatch: {
                              input: "$$products.brand",
                              regex: search,
                              options: "i",
                            },
                          },
                          {
                            $regexMatch: {
                              input: "$$products.title",
                              regex: search,
                              options: "i",
                            },
                          },
                          {
                            $regexMatch: {
                              input: "$$products.category",
                              regex: search,
                              options: "i",
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              },
              { $unwind: "$products" },
              {
                $match: 
                 
                   
                    { "products.deleted": false },
                  
              
              },
  
              { $project: { products: 1, _id: 0 } },
            ])
            .toArray();
          resolve(result);
        }
      }
    });
  },

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
      let check = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .aggregate([
          { $match: { _id: ObjectId(userId) } },
          { $unwind: "$orders" },
          { $unwind: "$orders.productDetails" },
          { $project: { "orders.productDetails": 1 } },
          { $match: { "orders.productDetails.productId": reviews.productId } },
        ])
        .toArray();
      console.log(true, true, true, check);
      if (check.length != 0) {
        let response = await db
          .get()
          .collection(collection.VENDOR_COLLECTION)
          .updateOne(
            { "products._id": ObjectId(reviews.productId) },
            { $push: { "products.$.reviews": customerReviews } }
          );
        resolve();
      } else {
        reject();
      }
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
  search: (text) => {
    return new Promise(async (resolve, reject) => {
      let result = await db
        .get()
        .collection(collection.VENDOR_COLLECTION)
        .aggregate([
          {
            $project: {
              _id: 0,
              products: {
                $filter: {
                  input: "$products",
                  as: "products",
                  cond: {
                    $or: [
                      {
                        $regexMatch: {
                          input: "$$products.brand",
                          regex: text,
                          options: "i",
                        },
                      },
                      {
                        $regexMatch: {
                          input: "$$products.title",
                          regex: text,
                          options: "i",
                        },
                      },
                      {
                        $regexMatch: {
                          input: "$$products.category",
                          regex: text,
                          options: "i",
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
          {$unwind:'$products'}
        ]).toArray()
        console.log(result);
        resolve(result)
    });
  },

  // getSortedProducts: (sortBy, gender, category) => {
  //   return new Promise(async (resolve, reject) => {
  //     console.log(sortBy);
  //     console.log(category);
  //     if (category == "all") category = null;

  //aslmdlmalmdslamd,.,mas,dklamsdklamdkasldklaskdnksdnkjdsfkjlsnkldfnaskldnaslk
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
  //sandklandsklnaskldnaklsdnklasndklansdklansdklnasdklasdklnklnkslankldnakldnaslkdnakjndklansdklasnkladsnlkds
  //     var sortedProducts;
  //     switch (sortBy) {
  //       case "addedOn":
  //         if (category) {
  //           sortedProducts = await db
  //             .get()
  //             .collection(collection.VENDOR_COLLECTION)
  //             .aggregate([
  //               { $unwind: "$products" },
  //               { $project: { products: 1, _id: 0 } },
  //               {
  //                 $match: {
  //                   $and: [
  //                     { "products.gender": gender },
  //                     { "products.category": category },
  //                   ],
  //                 },
  //               },
  //               { $sort: { "products.addedOn": -1 } },
  //             ])
  //             .toArray();
  //           console.log(sortedProducts);
  //           resolve(sortedProducts);
  //         } else {
  //           sortedProducts = await db
  //             .get()
  //             .collection(collection.VENDOR_COLLECTION)
  //             .aggregate([
  //               { $unwind: "$products" },
  //               { $project: { products: 1, _id: 0 } },
  //               { $match: { "products.gender": gender } },
  //               { $sort: { "products.addedOn": -1 } },
  //             ])
  //             .toArray();
  //           console.log(sortedProducts);
  //           resolve(sortedProducts);
  //         }
  //         break;
  //       case "netPricelowtohigh":
  //         if (category) {
  //           sortedProducts = await db
  //             .get()
  //             .collection(collection.VENDOR_COLLECTION)
  //             .aggregate([
  //               { $unwind: "$products" },
  //               { $project: { products: 1, _id: 0 } },
  //               {
  //                 $match: {
  //                   $and: [
  //                     { "products.gender": gender },
  //                     { "products.category": category },
  //                   ],
  //                 },
  //               },
  //               { $sort: { "products.netprice": 1 } },
  //             ])
  //             .toArray();
  //           console.log(sortedProducts);
  //           resolve(sortedProducts);
  //         } else {
  //           sortedProducts = await db
  //             .get()
  //             .collection(collection.VENDOR_COLLECTION)
  //             .aggregate([
  //               { $unwind: "$products" },
  //               { $project: { products: 1, _id: 0 } },
  //               { $match: { "products.gender": gender } },
  //               { $sort: { "products.netprice": 1 } },
  //             ])
  //             .toArray();
  //           console.log(sortedProducts);
  //           resolve(sortedProducts);
  //         }
  //         break;
  //       case "netPricehightolow":
  //         if (category) {
  //           sortedProducts = await db
  //             .get()
  //             .collection(collection.VENDOR_COLLECTION)
  //             .aggregate([
  //               { $unwind: "$products" },
  //               { $project: { products: 1, _id: 0 } },
  //               {
  //                 $match: {
  //                   $and: [
  //                     { "products.gender": gender },
  //                     { "products.category": category },
  //                   ],
  //                 },
  //               },
  //               { $sort: { "products.netprice": -1 } },
  //             ])
  //             .toArray();
  //           console.log(sortedProducts);
  //           resolve(sortedProducts);
  //         } else {
  //           sortedProducts = await db
  //             .get()
  //             .collection(collection.VENDOR_COLLECTION)
  //             .aggregate([
  //               { $unwind: "$products" },
  //               { $project: { products: 1, _id: 0 } },
  //               { $match: { "products.gender": gender } },
  //               { $sort: { "products.netprice": -1 } },
  //             ])
  //             .toArray();
  //           console.log(sortedProducts);
  //           resolve(sortedProducts);
  //         }
  //         break;
  //       case "rating":
  //         if (category) {
  //           sortedProducts = await db
  //             .get()
  //             .collection(collection.VENDOR_COLLECTION)
  //             .aggregate([
  //               { $unwind: "$products" },
  //               { $project: { products: 1, _id: 0 } },
  //               {
  //                 $match: {
  //                   $and: [
  //                     { "products.gender": gender },
  //                     { "products.category": category },
  //                   ],
  //                 },
  //               },
  //               { $sort: { "products.avgRating": -1 } },
  //             ])
  //             .toArray();
  //           console.log(true, sortedProducts);
  //           resolve(sortedProducts);
  //         } else {
  //           sortedProducts = await db
  //             .get()
  //             .collection(collection.VENDOR_COLLECTION)
  //             .aggregate([
  //               { $unwind: "$products" },
  //               { $project: { products: 1, _id: 0 } },
  //               { $match: { "products.gender": gender } },
  //               { $sort: { "products.avgRating": -1 } },
  //             ])
  //             .toArray();
  //           console.log(true, sortedProducts);
  //           resolve(sortedProducts);
  //         }
  //         break;

  //       default:
  //         break;
  //     }
  //   });
  // },
  // shopByCategory: (category, gender) => {
  //   console.log(category);
  //   return new Promise(async (resolve, reject) => {
  //     if (category == "all") {
  //       let products = await db
  //         .get()
  //         .collection(collection.VENDOR_COLLECTION)
  //         .aggregate([
  //           { $unwind: "$products" },
  //           { $project: { products: 1, _id: 0 } },
  //           { $match: { "products.gender": gender } },
  //         ])
  //         .toArray();
  //       resolve(products);
  //     } else {
  //       let products = await db
  //         .get()
  //         .collection(collection.VENDOR_COLLECTION)
  //         .aggregate([
  //           { $unwind: "$products" },
  //           { $project: { products: 1, _id: 0 } },
  //           {
  //             $match: {
  //               $and: [
  //                 { "products.gender": gender },
  //                 { "products.category": category },
  //               ],
  //             },
  //           },
  //         ])
  //         .toArray();
  //       resolve(products);
  //     }
  //   });
  // },
  // shopByBrands: (brand, category, gender) => {
  //   brand = brand.toUpperCase();
  //   console.log(brand, category, gender);
  //   return new Promise(async (resolve, reject) => {
  //     let products = await db
  //       .get()
  //       .collection(collection.VENDOR_COLLECTION)
  //       .aggregate([
  //         { $unwind: "$products" },
  //         { $project: { products: 1, _id: 0 } },
  //         {
  //           $match: {
  //             $and: [
  //               { "products.gender": gender },
  //               { "products.brand": brand },
  //             ],
  //           },
  //         },
  //       ])
  //       .toArray();
  //     console.log(products);
  //     resolve(products);
  //   });
  // },

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
