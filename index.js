// Require dependencies
var path = require('path');
var express = require('express');
var storeDB = require('./StoreDB');

var db = storeDB("mongodb://localhost:27017", "cpen400a-bookstore");

// Declare application parameters
var PORT = process.env.PORT || 3000;
var STATIC_ROOT = path.resolve(__dirname, './public');

// Defining CORS middleware to enable CORS.
// (should really be using "express-cors",
// but this function is provided to show what is really going on when we say "we enable CORS")
function cors(req, res, next){
    res.header("Access-Control-Allow-Origin", "*");
  	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  	res.header("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS,PUT");
  	next();
}

// Instantiate an express.js application
var app = express();

// Configure the app to use a bunch of middlewares
app.use(express.json());							// handles JSON payload
app.use(express.urlencoded({ extended : true }));	// handles URL encoded payload
app.use(cors);										// Enable CORS

app.use('/', express.static(STATIC_ROOT));			// Serve STATIC_ROOT at URL "/" as a static resource

// Configure '/products' endpoint
app.get('/products', async function(request, response) {
	var products = await db.getProducts(request.query);
	if (products instanceof Error) {
		response.status("500").send(products);
	}
	else {
		response.status("200").send(products);
	}
	response.end();
});

// Configure '/checkout' endpoint
app.post("/checkout", async function(request, response) {
	var order = request.body;
	var validOrder = order.hasOwnProperty("client_id") && typeof order.client_id == "string" &&
					order.hasOwnProperty("cart") && typeof order.cart == "object" &&
					order.hasOwnProperty("total") && typeof order.total == "number";
	if (!validOrder) {
		var errMsg = "Request payload is not a valid Order object";
		console.log(errMsg);
		response.status("500").send(errMsg);
		return;
	}
	var orderId = await db.addOrder(order);
	if (orderId instanceof Error) {
		response.status("500").send(orderId);
	}
	else {
		response.status("200").send(orderId);
	}
	response.end();
});

// Start listening on TCP port
app.listen(PORT, function(){
    console.log('Express.js server started, listening on PORT '+PORT);
});