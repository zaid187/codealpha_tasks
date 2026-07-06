const token =
localStorage.getItem("token");

if(!token){

    alert(
        "Please login to view orders."
    );

    window.location.href =
    "login.html";
}

const container =
document.getElementById("orders-container");

let allOrders = [];

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

async function fetchOrders(){

    try{

        const response =
        await fetch(
            "https://e-commerce-store-ozor.onrender.com/api/orders"
        );

        const orders =
        await response.json();

        allOrders = orders;

        updateStats(orders);

        displayOrders(orders);

    }
    catch(error){

        console.log(error);

    }
}

function updateStats(orders){

    const totalOrders =
    document.getElementById("total-orders");

    const totalSpent =
    document.getElementById("total-spent");

    const pendingOrders =
    document.getElementById("pending-orders");

    if(!totalOrders) return;

    totalOrders.innerText =
    orders.length;

    totalSpent.innerText =
    `₹${orders.reduce(
        (sum, order) =>
        sum + order.totalAmount,
        0
    )}`;

    pendingOrders.innerText =
    orders.filter(
        order =>
        (order.status || "Pending")
        === "Pending"
    ).length;
}

function displayOrders(orders){

    container.innerHTML = "";

    if(orders.length === 0){

        container.innerHTML = `

        <div class="empty-orders">

            <h2>📦 No Orders Yet</h2>

            <p>
                Start shopping and your orders
                will appear here.
            </p>

            <a
            href="index.html"
            class="shop-btn">

                Start Shopping

            </a>

        </div>

        `;

        return;
    }

    orders.reverse().forEach(order => {

        const firstProduct =
        order.products[0];

        const status =
        order.status || "Pending";

        const statusClass =
        status.toLowerCase() === "delivered"
        ? "status-delivered"
        : status.toLowerCase() === "shipped"
        ? "status-shipped"
        : "status-pending";

        container.innerHTML += `

        <div class="order-card">

            <div class="order-top">

                <div>

                    <h3>
                        Order #${order._id.slice(-6)}
                    </h3>

                    <p class="order-date">
                        ${new Date(
                            order.createdAt
                        ).toLocaleDateString()}
                    </p>

                </div>

                <span
                class="status-badge ${statusClass}">

                    ${status}

                </span>

            </div>

            <div class="order-body">

                <img
                    src="${getProductImage(firstProduct.name)}"
                    class="order-image"
                >

                <div class="order-info">

                    <h4>
                        ${firstProduct.name}
                    </h4>

                    <p>

                        ${
                            order.products.length > 1
                            ?
                            `+ ${order.products.length - 1} more items`
                            :
                            "1 Item"
                        }

                    </p>

                    <h3 class="order-price">

                        ₹${order.totalAmount}

                    </h3>

                    <div class="order-actions">

                        <button
class="track-btn"
onclick="trackOrder()">

    Track Order

</button>

                        <button
                        class="details-btn-order"
                        onclick="viewOrder('${order._id}')">

                            View Details

                        </button>

                    </div>

                </div>

            </div>

        </div>

        `;
    });
}

function viewOrder(orderId){

    const order =
    allOrders.find(
        o => o._id === orderId
    );

    const modalBody =
    document.getElementById("modalBody");

    if(!modalBody) return;

    modalBody.innerHTML = `

        <p>
            <strong>Order ID:</strong>
            ${order._id}
        </p>

        <br>

        <p>
            <strong>Total Amount:</strong>
            ₹${order.totalAmount}
        </p>

        <br>

        <p>
            <strong>Status:</strong>
            ${order.status || "Pending"}
        </p>

        <br>

      <h3>Order Timeline</h3>

<ul>

    <li>
        ✅ Order Confirmed
    </li>

    <li>
        📦 Processing
    </li>

    <li>
        🚚 Shipping Soon
    </li>

</ul>

<br>

<h3>Products</h3>

        ${order.products.map(product => `

            <p>

                ${product.name}
                (Qty: ${product.quantity})

            </p>

        `).join("")}

    `;

    document.getElementById(
        "orderModal"
    ).style.display = "block";
}

function closeModal(){

    document.getElementById(
        "orderModal"
    ).style.display = "none";
}

window.onclick = function(event){

    const modal =
    document.getElementById("orderModal");

    if(event.target === modal){

        modal.style.display = "none";
    }
}

document.addEventListener(
    "input",
    (e) => {

        if(
            e.target.id !==
            "searchOrders"
        ) return;

        const value =
        e.target.value.toLowerCase();

        const filtered =
        allOrders.filter(order =>

            order.products.some(product =>

                product.name
                .toLowerCase()
                .includes(value)

            )

        );

        displayOrders(filtered);

    }
);

fetchOrders();
function trackOrder(){

    alert(
        "📦 Order is being processed and will be shipped soon."
    );
}