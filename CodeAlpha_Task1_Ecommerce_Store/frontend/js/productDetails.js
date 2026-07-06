const container =
document.getElementById("product-details");

const params =
new URLSearchParams(window.location.search);

const id = params.get("id");

async function fetchProduct() {

    try {

        const response = await fetch(
            `https://e-commerce-store-ozor.onrender.com/api/products/${id}`
        );

        const product =
        await response.json();

        container.innerHTML = `
        
            <h1>${product.name}</h1>

            <h2>₹${product.price}</h2>

            <p>${product.description}</p>

            <p>Stock: ${product.stock}</p>

            <button onclick="addToCart()">
        Add To Cart
    </button>
        
        `;

    } catch (error) {

        console.log(error);
    }
}

fetchProduct();

let currentProduct;

async function fetchProduct() {

    try {

        const response = await fetch(
            `https://e-commerce-store-ozor.onrender.com/api/products/${id}`
        );

        const product = await response.json();

        currentProduct = product;

        container.innerHTML = `
            <h1>${product.name}</h1>

            <h2>₹${product.price}</h2>

            <p>${product.description}</p>

            <p>Stock: ${product.stock}</p>

            <button onclick="addToCart()">
                Add To Cart
            </button>
        `;

    } catch (error) {
        console.log(error);
    }
}

function addToCart() {

    let cart =
        JSON.parse(localStorage.getItem("cart")) || [];

    const existingItem =
        cart.find(item => item._id === currentProduct._id);

    if (existingItem) {

        existingItem.quantity += 1;

    } else {

        cart.push({
            ...currentProduct,
            quantity: 1
        });
    }

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

    alert("Added to Cart!");
}