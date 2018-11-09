// Will be used to instantiate a Store object to keep track of the items in the store and the items in the cart
function Store(serverUrl) {
    this.serverUrl = serverUrl;
    this.stock = {};
    this.cart = {};
    this.onUpdate = null;
}

Store.prototype.addItemToCart = function (itemName) {
    stopPurchaseTimeout();
    if (this.stock[itemName].quantity > 0) {
        console.log("Item " + itemName + " added");
        this.cart[itemName] = this.cart.hasOwnProperty(itemName) ? this.cart[itemName] + 1 : 1;
        this.stock[itemName].quantity--;
        this.onUpdate(itemName);
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
        this.onUpdate(itemName);
    }
    else {
        console.log("Item " + itemName + " not in cart");
    }
    createPurchaseTimeout();
}

var store = new Store("https://cpen400a-bookstore.herokuapp.com");

var showCart = function (cart) {
    stopPurchaseTimeout();
    console.log(cart);
    var modal = document.getElementById("modal");
    modal.style.visibility = "visible";
    renderCart(document.getElementById("modal-content"), store);
    createPurchaseTimeout();
};

var hideCart = function () {
    stopPurchaseTimeout();
    var modal = document.getElementById("modal");
    modal.style.visibility = "hidden";
    createPurchaseTimeout();
}

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

store.onUpdate = function(itemName) {
    if (typeof itemName == "undefined") {
        renderProductList(document.getElementById("productView"), store);
        return;
    }
    renderProduct(document.getElementById("product-" + itemName), this, itemName);
    renderCart(document.getElementById("modal-content"), this);
}

function renderProduct(container, storeInstance, itemName) {
    var product = storeInstance.stock[itemName];

    //Clear the container first
    while(container.firstChild) {
        container.removeChild(container.firstChild);
    }

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
    while(container.firstChild) {
        container.removeChild(container.firstChild);
    }

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

function renderCart(container, storeInstance) {
    // Clear the container first
    while(container.firstChild) {
        container.removeChild(container.firstChild);
    }

    var cartTable = document.createElement("table");
    cartTable.setAttribute("id", "cart-table");
    cartTable.cellPadding = "4px";
    container.appendChild(cartTable);

    var firstRow = document.createElement("tr");
    firstRow.setAttribute("id", "cart-row-border-bottom");
    firstRow.appendChild(createColumnTitle("Item"));
    firstRow.appendChild(createColumnTitle("Quantity"));
    firstRow.appendChild(createColumnTitle("Price"));
    cartTable.appendChild(firstRow);

    var totalPrice = 0;
    for (var itemName in storeInstance.cart) {
        var tableRow = document.createElement("tr");
        cartTable.appendChild(tableRow);
        // item name
        var tdName = document.createElement("td");
        tdName.textContent = itemName;
        tdName.setAttribute("class", "cart-table-data");
        tableRow.appendChild(tdName);
        // item quantity and buttons
        var quantity = storeInstance.cart[itemName];
        var tdQuantity = createQuantityCell(storeInstance, itemName, quantity);
        tdQuantity.setAttribute("class", "cart-table-data");
        tableRow.appendChild(tdQuantity);
        // total price
        var tdPrice = document.createElement("td");
        var totalItemPrice = storeInstance.stock[itemName].price * quantity;
        tdPrice.setAttribute("class", "cart-table-data");
        tdPrice.textContent = "$" + totalItemPrice;
        tableRow.appendChild(tdPrice);

        totalPrice += totalItemPrice;
    }

    // total due row
    var totalDueRow = document.createElement("tr");
    totalDueRow.setAttribute("id", "cart-row-border-top");
    // add an empty column first
    totalDueRow.appendChild(document.createElement("td"));
    totalDueRow.appendChild(createColumnTitle("Total Due:"));
    var totalPriceCell = createColumnTitle("$" + totalPrice);
    totalPriceCell.setAttribute("id", "cell-total-due");
    totalDueRow.appendChild(totalPriceCell);
    cartTable.appendChild(totalDueRow);
}

function createColumnTitle(title) {
    var columnTitle = document.createElement("td");
    columnTitle.setAttribute("class", "cart-cell-bold");
    columnTitle.textContent = title;
    return columnTitle;
}

function createQuantityCell(storeInstance, itemName, quantity) {
    var quantityCell = document.createElement("td");
    // create the buttons
    var incButton = document.createElement("button");
    var decButton = document.createElement("button");
    incButton.setAttribute("class", "btn-quantity");
    decButton.setAttribute("class", "btn-quantity");
    incButton.appendChild(document.createTextNode("+"));
    decButton.appendChild(document.createTextNode("-"));
    incButton.addEventListener("click", function () { storeInstance.addItemToCart(itemName) }, false);
    decButton.addEventListener("click", function () { storeInstance.removeItemFromCart(itemName) }, false)
    // create the text content
    var quantityText = document.createTextNode(quantity);
    // append children in order
    quantityCell.appendChild(incButton);
    quantityCell.appendChild(quantityText);
    quantityCell.appendChild(decButton);

    return quantityCell;
}

// hide cart when escape key is pressed
document.onkeydown = function(evt) {
    evt = evt || window.event;
    if (evt.keyCode == 27) {
        // escape key
        hideCart();
    }
};

// function for making AJAX GET calls
function ajaxGet(url, onSuccess, onError) {
    var numRetries = 0;
    var xhr;
    var getRequest = function() {
        if (numRetries <= 3) {
            xhr = new XMLHttpRequest();
            xhr.open("GET", url);
            xhr.onload = function() {
                console.log("xhrStatus = " + xhr.status);
                if (xhr.status == 200) {
                    var response = JSON.parse(xhr.responseText);
                    onSuccess(response);
                    return;
                }
                else {
                    numRetries++;
                    getRequest();
                }
            }
            xhr.timeout = 2000; // 2 seconds
            xhr.ontimeout = function() {
                console.log("onTimeout");
                numRetries++;
                getRequest();
            }
            xhr.onerror = function() {
                console.log("onError");
                numRetries++;
                getRequest();
            }
            xhr.send();
        }
        else {
            var errMessage = xhr.responseText || "Timed out";
            console.log("numRetries = " + numRetries + ": " + errMessage);
            onError(errMessage);
            return;
        }
    }

    getRequest();
}