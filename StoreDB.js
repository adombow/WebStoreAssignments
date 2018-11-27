var MongoClient = require('mongodb').MongoClient;	// require the mongodb driver

/**
 * Uses mongodb v3.1.9 - [API Documentation](http://mongodb.github.io/node-mongodb-native/3.1/api/)
 * StoreDB wraps a mongoDB connection to provide a higher-level abstraction layer
 * for manipulating the objects in our bookstore app.
 */
function StoreDB(mongoUrl, dbName) {
	if (!(this instanceof StoreDB)) return new StoreDB(mongoUrl, dbName);
	this.connected = new Promise(function (resolve, reject) {
		MongoClient.connect(
			mongoUrl,
			{
				useNewUrlParser: true
			},
			function (err, client) {
				if (err) reject(err);
				else {
					console.log('[MongoClient] Connected to ' + mongoUrl + '/' + dbName);
					resolve(client.db(dbName));
				}
			}
		)
	});
}

StoreDB.prototype.getProducts = function (queryParams) {
	var query = { $and: [] };
	if (queryParams.hasOwnProperty("minPrice")) {
		query.$and.push({ "price": { $gte: parseInt(queryParams.minPrice, 10) } });
	}
	if (queryParams.hasOwnProperty("maxPrice")) {
		query.$and.push({ "price": { $lte: parseInt(queryParams.maxPrice, 10) } });
	}
	if (queryParams.hasOwnProperty("category")) {
		query.$and.push({ "category": queryParams.category });
	}
	return this.connected.then(function (db) {
		return new Promise(function (resolve, reject) {
			var products = {};
			db.collection("products").find(query.$and.length > 0 ? query : {}).toArray(function (err, result) {
				if (err) {
					console.log("Product promise rejected: " + err);
					reject(err);
				} else {
					console.log("Product promise succesful: " + result);
					for (var i = 0; i < result.length; i++) {
						var key = result[i]._id;
						products[key] = {
							label: result[i].label,
							price: result[i].price,
							quantity: result[i].quantity,
							imageUrl: result[i].imageUrl
						}
					}
					resolve(products);
				}
			});
		})
	})
}

StoreDB.prototype.addOrder = function (order) {
	return this.connected.then(function (db) {
		return new Promise(function (resolve, reject) {
			db.collection("orders").insert(order, function (err, result) {
				if (err) {
					console.log("Product promise rejected: " + err);
					reject(err);
				} else {
					console.log("Product promise succesful: " + result);
				}
			});
		})
	})
}

module.exports = StoreDB;