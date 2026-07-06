const container = document.getElementById("products-container");

const searchInput =
document.getElementById("searchInput");

const searchBtn =
document.getElementById("searchBtn");

let products = [];

// PRODUCT IMAGES

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
    "https://images.unsplash.com/photo-1523275335684-37899b6baf30";
}

// FETCH PRODUCTS

async function fetchProducts(){

    try{

        const response = await fetch(
            "https://e-commerce-store-ozor.onrender.com/api/products"
        );

        products = await response.json();

        displayProducts(products);

    }
    catch(error){

        console.log(error);

        container.innerHTML = `

        <div class="empty-orders">

            <h2>⚠ Failed to Load Products</h2>

        </div>

        `;
    }
}

// DISPLAY PRODUCTS

function displayProducts(productsList){

    container.innerHTML = "";

    if(productsList.length === 0){

        container.innerHTML = `

        <div class="empty-orders">

            <h2>🔍 No Products Found</h2>

            <p>
                Try searching with another keyword.
            </p>

        </div>

        `;

        return;
    }

    productsList.forEach(product => {

        container.innerHTML += `

        <div class="product-card">

            <div class="discount-badge">

                15% OFF

            </div>

            <img
                src="${getProductImage(product.name)}"
                class="product-image"
                alt="${product.name}"
            >

            <div class="product-info">

                <div class="rating">

                    ⭐⭐⭐⭐⭐
                    <span>(4.8)</span>

                </div>

                <h2>${product.name}</h2>

                <p class="price">

                    ₹${product.price}

                </p>

                <p class="old-price">

                    ₹${Math.floor(product.price * 1.15)}

                </p>

                <p class="description">

                    ${product.description}

                </p>

                <p class="stock">

                    ✔ In Stock: ${product.stock}

                </p>

                <div class="card-buttons">

                    <a
                        href="product.html?id=${product._id}"
                        class="details-btn">

                        View Details

                    </a>

                    <button
                        class="cart-btn"
                        onclick="addToCart('${product._id}')">

                        Add To Cart

                    </button>

                </div>

            </div>

        </div>

        `;
    });
}

// SEARCH

function searchProducts(){

    const searchTerm =
    searchInput.value
    .toLowerCase()
    .trim();

    const filteredProducts =
    products.filter(product =>

        product.name
        .toLowerCase()
        .includes(searchTerm)

        ||

        product.description
        .toLowerCase()
        .includes(searchTerm)

    );

    displayProducts(filteredProducts);
}

// ADD TO CART

function addToCart(productId){

    const token =
    localStorage.getItem("token");

    if(!token){

        alert(
            "Please login first to add products to cart."
        );

        window.location.href =
        "login.html";

        return;
    }

    const product = products.find(
        p => p._id === productId
    );

    let cart =
    JSON.parse(
        localStorage.getItem("cart")
    ) || [];

    cart.push(product);

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

    updateCartCount();

    alert(
        `${product.name} added to cart 🛒`
    );
}

// CART COUNT

function updateCartCount(){

    const cart =
    JSON.parse(
        localStorage.getItem("cart")
    ) || [];

    const badge =
    document.getElementById(
        "cart-count"
    );

    if(badge){

        badge.innerText =
        cart.length;
    }
}

// USER SESSION

const token =
localStorage.getItem("token");

const user =
JSON.parse(
    localStorage.getItem("user")
);

const loginLink =
document.querySelector(
    'a[href="login.html"]'
);

const userName =
document.getElementById(
    "userName"
);

const logoutBtn =
document.getElementById(
    "logoutBtn"
);

if(token){

    if(loginLink){

        loginLink.style.display =
        "none";
    }

    if(userName && user){

        userName.innerText =
        `Hi, ${user.name}`;
    }

}
else{

    if(logoutBtn){

        logoutBtn.style.display =
        "none";
    }
}

// LOGOUT

if(logoutBtn){

    logoutBtn.addEventListener(
        "click",
        () => {

            localStorage.removeItem(
                "token"
            );

            localStorage.removeItem(
                "user"
            );

            window.location.href =
            "login.html";
        }
    );
}

// SEARCH EVENTS

if(searchInput){

    searchInput.addEventListener(
        "keyup",
        searchProducts
    );
}

if(searchBtn){

    searchBtn.addEventListener(
        "click",
        searchProducts
    );
}

// INITIAL LOAD

fetchProducts();

updateCartCount();

const shopNowBtn =
document.getElementById("shopNowBtn");

if(shopNowBtn){

    shopNowBtn.addEventListener("click", () => {

        document
        .querySelector(".products-section")
        .scrollIntoView({
            behavior: "smooth"
        });

    });

}
const cartLink =
document.getElementById("cartLink");

if(cartLink){

    cartLink.addEventListener(
        "click",
        (e) => {

            e.preventDefault();

            const token =
            localStorage.getItem("token");

            if(!token){

                alert(
                    "Please login first."
                );

                window.location.href =
                "login.html";

                return;
            }

            window.location.href =
            "cart.html";

        }
    );

}