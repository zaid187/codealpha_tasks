const container = document.getElementById("cart-container");
const totalElement = document.getElementById("total");
const placeOrderBtn = document.getElementById("placeOrderBtn");

// Product Images
function getProductImage(productName){

    const images = {

        "iPhone 15":
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9",

        "Samsung Galaxy S25":
        "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf",

        "iPad Air":
        "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0",

        "MacBook Air M4":
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853",

        "Dell XPS 15":
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853",

        "Sony WH-1000XM5":
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",

        "Apple Watch Series 10":
        "https://images.unsplash.com/photo-1579586337278-3befd40fd17a",

        "Mechanical Gaming Keyboard":
        "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae",

        "Logitech MX Master 3S":
        "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46"
    };

    return images[productName] ||
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30";
}

function loadCart(){

    const cart =
        JSON.parse(localStorage.getItem("cart")) || [];

    container.innerHTML = "";

    let total = 0;

    const itemsCount =
        document.getElementById("items-count");

    const subtotal =
        document.getElementById("subtotal");

    if(itemsCount){
        itemsCount.innerText = cart.length;
    }

    if(cart.length === 0){

        container.innerHTML = `

        <div class="empty-cart">

            <h2>🛒 Your Cart is Empty</h2>

            <p>
                Looks like you haven't added anything yet.
            </p>

            <a href="index.html" class="shop-btn">
                Continue Shopping
            </a>

        </div>

        `;

        totalElement.innerText = "₹0";

        if(subtotal){
            subtotal.innerText = "₹0";
        }

        return;
    }

    cart.forEach(item => {

        const quantity = item.quantity || 1;

        total += item.price * quantity;

        container.innerHTML += `

        <div class="cart-item">

            <img
                src="${getProductImage(item.name)}"
                alt="${item.name}"
            >

            <div class="cart-info">

                <h3>${item.name}</h3>

                <p class="cart-price">
                    ₹${item.price}
                </p>

                <p>
                    ${item.description}
                </p>

                <p class="stock">
                    ✔ In Stock
                </p>

                <div class="quantity-controls">

                    <button
                        onclick="changeQuantity('${item._id}', -1)">
                        −
                    </button>

                    <span>${quantity}</span>

                    <button
                        onclick="changeQuantity('${item._id}', 1)">
                        +
                    </button>

                </div>

            </div>

            <button
                class="remove-btn"
                onclick="removeItem('${item._id}')">

                Remove

            </button>

        </div>

        `;
    });

    totalElement.innerText =
        `₹${total}`;

    if(subtotal){
        subtotal.innerText =
            `₹${total}`;
    }
}

function removeItem(id){

    let cart =
        JSON.parse(localStorage.getItem("cart")) || [];

    cart = cart.filter(
        item => item._id !== id
    );

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

    loadCart();
    updateCartCount();
}

function changeQuantity(id, change){

    let cart =
        JSON.parse(localStorage.getItem("cart")) || [];

    cart = cart.map(item => {

        if(item._id === id){

            item.quantity =
                (item.quantity || 1) + change;

            if(item.quantity < 1){
                item.quantity = 1;
            }
        }

        return item;
    });

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

    loadCart();
    updateCartCount();
}

placeOrderBtn.addEventListener("click", async () => {

    const token =
localStorage.getItem("token");

if(!token){

    alert(
        "Please login before placing an order."
    );

    window.location.href =
    "login.html";

    return;
}

    const cart =
        JSON.parse(localStorage.getItem("cart")) || [];

    if(cart.length === 0){

        alert("Cart is empty");
        return;
    }

    const total = cart.reduce(

        (sum, item) =>

            sum +
            (item.price * (item.quantity || 1)),

        0
    );

    const orderProducts = cart.map(product => ({

        productId: product._id,

        name: product.name,

        price: product.price,

        quantity: product.quantity || 1

    }));

    try{

        const response = await fetch(

            "https://e-commerce-store-ozor.onrender.com/api/orders",

            {

                method: "POST",

                headers: {
                    "Content-Type":
                    "application/json"
                },

                body: JSON.stringify({

                    products: orderProducts,

                    totalAmount: total

                })

            }

        );

        const data =
            await response.json();

        console.log(data);

        alert(
            "🎉 Order Placed Successfully!"
        );

        localStorage.removeItem("cart");

        updateCartCount();

        window.location.reload();

    }
    catch(error){

        console.log(error);

        alert(
            "Failed to place order"
        );
    }
});

function updateCartCount(){

    const cart =
        JSON.parse(localStorage.getItem("cart")) || [];

    const badge =
        document.getElementById("cart-count");

    if(badge){

        badge.innerText = cart.length;
    }
}

loadCart();
updateCartCount();