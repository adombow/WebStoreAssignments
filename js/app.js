// Will be used to instantiate a Store object to keep track of the items in the store and the items in the cart
function Store(initialStock) {
    this.stock = initialStock;
    this.cart = {};
}

Store.prototype.addItemToCart = function(itemName) {
}

Store.prototype.removeItemFromCart = function(itemName) {
}