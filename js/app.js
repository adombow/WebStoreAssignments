// Will be used to instantiate a Store object to keep track of the items in the store and the items in the cart
function Store(initialStock) {
    this.stock = initialStock;
    this.cart = {};
}

Store.prototype.addItemToCart = function(itemName) {
}

Store.prototype.removeItemFromCart = function(itemName) {
}

var products = {
    Box1: {
        label: "box1",
        imageUrl: "images/Box1_$10.png",
        price: 10,
        quantity: 5
    },
    Box2: {
        label: "box2",
        imageUrl: "images/Box2_$5.png",
        price: 5,
        quantity: 5
    },
    Clothes1: {
        label: "clothes1",
        imageUrl: "images/Clothes1_$20.png",
        price: 20,
        quantity: 5
    },
    Clothes2: {
        label: "clothes2",
        imageUrl: "images/Clothes2_$30.png",
        price: 30,
        quantity: 5
    },
    Jeans: {
        label: "jeans",
        imageUrl: "images/Jeans_$50.png",
        price: 50,
        quantity: 5
    },
    Keyboard: {
        label: "keyboard",
        imageUrl: "images/Keyboard_$20.png",
        price: 20,
        quantity: 5
    },
    KeyboardCombo: {
        label: "keyboardCombo",
        imageUrl: "images/KeyboardCombo_$40.png",
        price: 40,
        quantity: 5
    },
    Mice: {
        label: "mice",
        imageUrl: "images/Mice_$20.png",
        price: 20,
        quantity: 5
    },
    PC1: {
        label: "pc1",
        imageUrl: "images/PC1_$350.png",
        price: 350,
        quantity: 5
    },
    PC2: {
        label: "pc2",
        imageUrl: "images/PC2_$400.png",
        price: 400,
        quantity: 5
    },
    PC3: {
        label: "pc3",
        imageUrl: "images/PC3_$300.png",
        price: 300,
        quantity: 5
    },
    Tent: {
        label: "tent",
        imageUrl: "images/Tent_$100.png",
        price: 100,
        quantity: 5
    }
};