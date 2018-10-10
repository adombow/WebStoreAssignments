// Will be used to instantiate a Store object to keep track of the items in the store and the items in the cart
function Store(initialStock) {
    this.stock = initialStock;
    this.cart = {};
}

Store.prototype.addItemToCart = function (itemName) {
    stopPurchaseTimeout();
    if (this.stock[itemName].quantity > 0) {
        console.log("Item " + itemName + " added");
        this.cart[itemName] = this.cart.hasOwnProperty(itemName) ? this.cart[itemName] + 1 : 1;
        this.stock[itemName].quantity--;
    }
    else {
        console.log("Item " + itemName + " sold out");
    }
    createPurchaseTimeout();
}

Store.prototype.removeItemFromCart = function (itemName) {
    stopPurchaseTimeout();
    if (this.cart.hasOwnProperty(itemName)) {
        console.log("Item " + itemName + " removed");
        if (--this.cart[itemName] == 0) {
            delete this.cart[itemName];
        }
        this.stock[itemName].quantity++;
    }
    else {
        console.log("Item " + itemName + " not in cart");
    }
    createPurchaseTimeout();
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

var store = new Store(products);

var showCart = function (cart) {
    stopPurchaseTimeout();
    console.log(cart);
    var cartString = Object.keys(cart).length > 0 ? "" : "Cart is empty"; // using Objects.keys() for reliability
    for (var key in cart) {
        cartString += key + " : " + cart[key] + "\n";
    }
    alert(cartString);
    createPurchaseTimeout();
    return cartString;
};

var currTimeout;
var shouldTimeout = false; //Just change this to false if you don't want the timeout running
var TIMEOUT_MS = 30000; //Timeout set for 30s

function createPurchaseTimeout() {
    if (shouldTimeout) {
        currTimeout = setTimeout(
            function () {
                alert("Hey there, freeloader!  Were you actually planning on buying anything or did " +
                    "you just want to waste our server resources?");
                //alert is blocking so timeout will not be reset until alert is closed
                createPurchaseTimeout();
            }, TIMEOUT_MS);
    }
}

function stopPurchaseTimeout() {
    clearTimeout(currTimeout);
}

window.addEventListener("load", createPurchaseTimeout());
//Need wrapper function otherwise getElement will fire before the html is placed
window.addEventListener("load", function () {
    renderProductList(document.getElementById("productView"), store)
});

function renderProduct(container, storeInstance, itemName) {
    var product = storeInstance.stock[itemName];

    //Clear the container first
    container.innerHTML = '';

    var image = document.createElement("img");
    image.setAttribute("class", "productImg");
    image.setAttribute("src", "images/" + itemName + "_$" + product.price + ".png");
    image.setAttribute("alt", itemName);
    container.appendChild(image);

    var prodName = document.createElement("p");
    prodName.setAttribute("class", "productName");
    var nameNode = document.createTextNode(itemName);
    prodName.appendChild(nameNode);
    container.appendChild(prodName);

    var price = document.createElement("span");
    price.setAttribute("class", "price");
    var priceNode = document.createTextNode(product.price);
    price.appendChild(priceNode);
    container.appendChild(price);

    //Product can be added to cart as quantity is not 0
    if (product.quantity > 0) {
        var btnAdd = document.createElement("button");
        btnAdd.setAttribute("class", "btn-add");
        btnAdd.setAttribute("type", "button");
        btnAdd.addEventListener("click", function () { storeInstance.addItemToCart(itemName) }, false);
        var addBtnNode = document.createTextNode("Add Item To Cart");
        btnAdd.appendChild(addBtnNode);
        container.appendChild(btnAdd);
    }

    //Product can be removed from cart as it's currently in the cart
    if (storeInstance.cart.hasOwnProperty(itemName)) {
        var btnRmv = document.createElement("button");
        btnRmv.setAttribute("class", "btn-remove");
        btnRmv.setAttribute("type", "button");
        btnRmv.addEventListener("click", function () { storeInstance.removeItemFromCart(itemName) }, false);
        var rmvBtnNode = document.createTextNode("Remove Item From Cart");
        btnRmv.appendChild(rmvBtnNode);
        container.appendChild(btnRmv);
    }
}

function renderProductList(container, storeInstance) {
    //Clear the container first
    container.innerHTML = '';

    var productList = document.createElement("ul");
    productList.setAttribute("id", "productList");
    container.appendChild(productList);

    for (var product in storeInstance.stock) {
        var listItem = document.createElement("li");
        listItem.setAttribute("class", "product");
        listItem.setAttribute("id", "product-" + product);
        productList.appendChild(listItem);

        renderProduct(listItem, storeInstance, product);
    }
}
