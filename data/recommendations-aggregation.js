// Correctly call the aggregation using a cursor and toArray
var Product = require('../models/product.js');
var MongoClient = require('mongodb').MongoClient,
  test = require('assert');
MongoClient.connect('mongodb://localhost:27017/hackathon', function(err, db) {
  // Some docs for insertion
  Product

  // Create a collection
  var collection = db.collection('products');
  // Insert the docs
  collection.insertMany(docs, {w: 1}, function(err, result) {

    // Execute aggregate, notice the pipeline is expressed as an Array
    var cursor = collection.aggregate([
        { $project : {
          author : 1,
          tags : 1
        }},
        { $unwind : "$Attributes" },
        { $group : {
          _id : {Attributes : "$Attributes"},
          authors : { $addToSet : "$author" }
        }}
      ], { cursor: { batchSize: 1 } });

    // Get all the aggregation results
    cursor.toArray(function(err, docs) {
      test.equal(null, err);
      test.equal(2, docs.length);
      db.close();
    });
  });
});
