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

Store.prototype.syncWithServer = function (onSync) {
    var thisStore = this;
    ajaxGet(this.serverUrl + "products",
        function (response) {
            var delta = {};
            console.log(response);
            for (var product in response) {
                // The product does not exist yet so add it to our stock
                if (!thisStore.stock.hasOwnProperty(product)) {
                    thisStore.stock[product] = {
                        label: response[product].label,
                        imageUrl: response[product].imageUrl,
                        price: 0,
                        quantity: 0
                    };
                }

                var currProdPrice = thisStore.stock[product].price;
                var currProdQuantity = thisStore.stock[product].quantity;

                var deltaPrice = response[product].price - currProdPrice;
                var deltaQuantity = response[product].quantity - currProdQuantity;
                var newDelta = {
                    price: deltaPrice,
                    quantity: deltaQuantity
                };
                if (deltaPrice != 0 && deltaQuantity != 0)
                    delta[product] = newDelta;
            }

            for (var deltaProduct in delta) {
                var currProdPrice = thisStore.stock[deltaProduct].price;
                var currProdQuantity = thisStore.stock[deltaProduct].quantity;
                var cartQuantity = 0;

                if (thisStore.cart.hasOwnProperty(deltaProduct)) {
                    cartQuantity = thisStore.cart[deltaProduct];
                }

                var totalQuantity = cartQuantity + currProdQuantity + delta[deltaProduct].quantity;

                if (cartQuantity <= totalQuantity)
                    thisStore.stock[deltaProduct].quantity = totalQuantity - cartQuantity;
                else {
                    thisStore.cart[deltaProduct] -= cartQuantity - totalQuantity;
                    thisStore.stock[deltaProduct].quantity = 0;
                }

                thisStore.stock[deltaProduct].price = currProdPrice + delta[deltaProduct].price;
            }

            // re-draw the products
            thisStore.onUpdate();

            if (onSync != null)
                onSync(delta);
        },
        function (error) {
            //invoked after all 3 retries fail
            console.log(error);
            thisStore.onUpdate();
        });
}

Store.prototype.checkOut = function (onFinish) {
    var thisStore = this;
    this.syncWithServer(function (delta) {
        // If any of the products have changed price/quantity inform the user
        if (Object.keys(delta).length !== 0) {
            var deltaStr = "";
            for (var prod in thisStore.cart) {
                if (delta.hasOwnProperty(prod)) {
                    var currPrice = thisStore.stock[prod].price;
                    if (delta[prod].price != 0 && currPrice - delta[prod].price != 0) {
                        deltaStr += "Price of " + prod + " changed from $" +
                            (currPrice - delta[prod].price) + " to $" + currPrice + "\n";
                    }
                    var currQuantity = thisStore.stock[prod].quantity + thisStore.cart[prod];
                    if (delta[prod].quantity != 0 && currQuantity - delta[prod].quantity != 0) {
                        deltaStr += "Quantity of " + prod + " changed from " +
                            (currQuantity - delta[prod].quantity) + " to " + currQuantity + "\n";
                    }
                }
            }
            alert(deltaStr);
        } else {
            var totalDue = 0;
            for (var prod in thisStore.cart) {
                totalDue += thisStore.cart[prod] * thisStore.stock[prod].price;
            }
            // make POST request for checkout
            ajaxPost(this.serverUrl + "checkout",
                Order = {
                    client_id: Math.random(),
                    cart: thisStore.cart,
                    total: totalDue
                },
                function (response) {
                    console.log("postResponseSuccess");
                    alert("Your items were successfully checked out!");
                    thisStore.cart = {};
                    thisStore.onupdate();
                },
                function (error) {
                    console.log("postResponseError");
                    alert("Error: " + error);
                });
        }

        if (onFinish != null)
            onFinish();
    });
}

Store.prototype.queryProducts = function (query, callback) {
    var self = this;
    var queryString = Object.keys(query).reduce(function (acc, key) {
        return acc + (query[key] ? ((acc ? '&' : '') + key + '=' + query[key]) : '');
    }, '');
    ajaxGet(this.serverUrl + "/products?" + queryString,
        function (products) {
            Object.keys(products)
                .forEach(function (itemName) {
                    var rem = products[itemName].quantity - (self.cart[itemName] || 0);
                    if (rem >= 0) {
                        self.stock[itemName].quantity = rem;
                    }
                    else {
                        self.stock[itemName].quantity = 0;
                        self.cart[itemName] = products[itemName].quantity;
                        if (self.cart[itemName] === 0) delete self.cart[itemName];
                    }

                    self.stock[itemName] = Object.assign(self.stock[itemName], {
                        price: products[itemName].price,
                        label: products[itemName].label,
                        imageUrl: products[itemName].imageUrl
                    });
                });
            self.onUpdate();
            callback(null, products);
        },
        function (error) {
            callback(error);
        }
    )
}

function renderMenu(container, storeInstance) {
    while (container.lastChild) container.removeChild(container.lastChild);
    if (!container._filters) {
        container._filters = {
            minPrice: null,
            maxPrice: null,
            category: ''
        };
        container._refresh = function () {
            storeInstance.queryProducts(container._filters, function (err, products) {
                if (err) {
                    alert('Error occurred trying to query products');
                    console.log(err);
                }
                else {
                    displayed = Object.keys(products);
                    renderProductList(document.getElementById('productView'), storeInstance);
                }
            });
        }
    }

    var box = document.createElement('div'); container.appendChild(box);
    box.id = 'price-filter';
    var input = document.createElement('input'); box.appendChild(input);
    input.type = 'number';
    input.value = container._filters.minPrice;
    input.min = 0;
    input.placeholder = 'Min Price';
    input.addEventListener('blur', function (event) {
        container._filters.minPrice = event.target.value;
        container._refresh();
    });

    input = document.createElement('input'); box.appendChild(input);
    input.type = 'number';
    input.value = container._filters.maxPrice;
    input.min = 0;
    input.placeholder = 'Max Price';
    input.addEventListener('blur', function (event) {
        container._filters.maxPrice = event.target.value;
        container._refresh();
    });

    var list = document.createElement('ul'); container.appendChild(list);
    list.id = 'menu';
    var listItem = document.createElement('li'); list.appendChild(listItem);
    listItem.className = 'menuItem' + (container._filters.category === '' ? ' active' : '');
    listItem.appendChild(document.createTextNode('All Items'));
    listItem.addEventListener('click', function (event) {
        container._filters.category = '';
        container._refresh()
    });
    var CATEGORIES = ['Clothing', 'Technology', 'Office', 'Outdoor'];
    for (var i in CATEGORIES) {
        var listItem = document.createElement('li'); list.appendChild(listItem);
        listItem.className = 'menuItem' + (container._filters.category === CATEGORIES[i] ? ' active' : '');
        listItem.appendChild(document.createTextNode(CATEGORIES[i]));
        listItem.addEventListener('click', (function (i) {
            return function (event) {
                container._filters.category = CATEGORIES[i];
                container._refresh();
            }
        })(i));
    }
}

var store = new Store("http://localhost:3000/");//https://cpen400a-bookstore.herokuapp.com");
var displayed = [];

store.syncWithServer(function (delta) {
    for (var prodIds in delta) {
        displayed.push(prodIds);
    }
});

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

var cartCheckOut = function () {
    stopPurchaseTimeout();
    var checkOutBtn = document.getElementById("btn-check-out");
    checkOutBtn.disabled = true;
    store.checkOut(function () {
        checkOutBtn.disabled = false;
    });
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

store.onUpdate = function (itemName) {
    renderMenu(document.getElementById("menuView"), this);
    if (typeof itemName == "undefined") {
        renderProductList(document.getElementById("productView"), this);
        return;
    }
    renderProduct(document.getElementById("product-" + itemName), this, itemName);
    renderCart(document.getElementById("modal-content"), this);
}

function renderProduct(container, storeInstance, itemName) {
    var product = storeInstance.stock[itemName];

    //Clear the container first
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    var image = document.createElement("img");
    image.setAttribute("class", "productImg");
    image.setAttribute("src", product.imageUrl);
    image.setAttribute("alt", itemName);
    container.appendChild(image);

    var prodName = document.createElement("p");
    prodName.setAttribute("class", "productName");
    var nameNode = document.createTextNode(itemName);
    prodName.appendChild(nameNode);
    container.appendChild(prodName);

    var price = document.createElement("span");
    price.setAttribute("class", "price");
    var priceNode = document.createTextNode("$" + product.price);
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
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    var productList = document.createElement("ul");
    productList.setAttribute("id", "productList");
    container.appendChild(productList);

    for (var i = 0; i < displayed.length; i++) {
        var product = displayed[i];
        var listItem = document.createElement("li");
        listItem.setAttribute("class", "product");
        listItem.setAttribute("id", "product-" + product);
        productList.appendChild(listItem);

        renderProduct(listItem, storeInstance, product);
    }
}

function renderCart(container, storeInstance) {
    // Clear the container first
    while (container.firstChild) {
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
document.onkeydown = function (evt) {
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
    var getRequest = function () {
        if (numRetries <= 3) {
            xhr = new XMLHttpRequest();
            xhr.open("GET", url);
            xhr.onload = function () {
                console.log("xhrStatus = " + xhr.status);
                if (xhr.status == 200) {
                    console.log(xhr);
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
            xhr.ontimeout = function () {
                console.log("onTimeout");
                numRetries++;
                getRequest();
            }
            xhr.onerror = function () {
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

// function for making AJAX POST calls
function ajaxPost(url, data, onSuccess, onError) {
    var numRetries = 0;
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.onload = function () {
        console.log("xhrStatus = " + xhr.status);
        if (xhr.status == 200) {
            var response = JSON.parse(xhr.responseText);
            onSuccess(response);
        }
        else {
            onError(xhr.responseText);
        }
    }
    xhr.timeout = 10000; // 10 seconds
    xhr.ontimeout = function () {
        console.log("onTimeout");
        onError("Timed out");
    }
    xhr.onerror = function () {
        console.log("onError");
        onError(xhr.responseText);
    }
    xhr.send(data);
}