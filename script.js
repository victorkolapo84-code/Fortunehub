// ===================================================
// 1. DATA AND CONSTANTS
// ===================================================

// Variable to hold the product data
let products = []; 

// Cart State (Load from localStorage or start empty)
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// DOM Elements
const productsGrid = document.getElementById('productsGrid');
const cartCount = document.getElementById('cartCount');
const cartModal = document.getElementById('cartModal');
const closeModal = document.getElementById('closeCartModal');
const cartItemsContainer = document.getElementById('cartItems');
const cartTotalElement = document.getElementById('cartTotal');
const cartSubTotalElement = document.getElementById('cartSubTotal');
const shippingFeeAmountElement = document.getElementById('shippingFeeAmount');
const checkoutButton = document.getElementById('checkoutButton');
const continueShoppingButton = document.getElementById('continueShoppingButton');
const filterButtons = document.querySelectorAll('.filter-btn');
const searchInput = document.getElementById('searchInput');
const categoryCards = document.querySelectorAll('.category-card');
const cartIcon = document.getElementById('cartIcon');

// Constants
const SHIPPING_FEE_NAIRA = 1500; 
const PAYSTACK_PUBLIC_KEY = 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';


// ===================================================
// 2. CORE E-COMMERCE LOGIC (Functions)
// ===================================================

function getProductById(id) {
    return products.find(p => p.id === id); 
}

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) cartCount.textContent = totalItems;

    cartItemsContainer.innerHTML = '';
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align: center; color: #555;">Your cart is empty.</p>';
        if (checkoutButton) checkoutButton.disabled = true;
    } else {
        if (checkoutButton) checkoutButton.disabled = false;

        cart.forEach(item => {
            const itemHTML = `
                <div class="cart-item">
                    <div class="item-details">
                        <img src="${item.image}" alt="${item.name}">
                        <div class="item-info">
                            <h4>${item.name}</h4>
                            <span class="item-price">${formatCurrency(item.price)}</span>
                        </div>
                    </div>
                    <div class="item-quantity">
                        <button class="btn-quantity minus" data-id="${item.id}" data-change="-1">-</button>
                        <span>${item.quantity}</span>
                        <button class="btn-quantity plus" data-id="${item.id}" data-change="1">+</button>
                        <i class="fas fa-trash-alt remove-item" data-id="${item.id}"></i>
                    </div>
                </div>
            `;
            cartItemsContainer.insertAdjacentHTML('beforeend', itemHTML);
        });

        document.querySelectorAll('.btn-quantity').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                const change = parseInt(e.currentTarget.dataset.change);
                updateQuantity(id, change);
            });
        });

        document.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                removeItem(id);
            });
        });
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingFee = cart.length > 0 ? SHIPPING_FEE_NAIRA * 100 : 0;
    const grandTotal = subtotal + shippingFee;

    if (cartSubTotalElement) cartSubTotalElement.textContent = formatCurrency(subtotal);
    if (shippingFeeAmountElement) shippingFeeAmountElement.textContent = formatCurrency(shippingFee);
    if (cartTotalElement) cartTotalElement.textContent = (grandTotal / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 });
}

function addToCart(productId, quantity = 1) {
    const product = getProductById(productId);
    if (!product || product.outOfStock) {
        alert('Product is out of stock.');
        return;
    }

    const cartItem = cart.find(item => item.id === productId);

    if (cartItem) {
        cartItem.quantity += quantity;
    } else {
        cart.push({
            id: productId,
            name: product.name,
            price: product.price,
            quantity: quantity,
            image: product.image
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
    alert(`${product.name} added to cart!`);
}

function updateQuantity(productId, change) {
    const cartItem = cart.find(item => item.id === productId);

    if (cartItem) {
        cartItem.quantity += change;
        if (cartItem.quantity <= 0) {
            cart = cart.filter(item => item.id !== productId);
        }
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
}

function removeItem(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
}

function formatCurrency(amountInKobo) {
    const amountInNaira = amountInKobo / 100;
    return `₦${amountInNaira.toLocaleString('en-NG')}`;
}


// ===================================================
// 3. PRODUCT DISPLAY AND FILTERING
// ===================================================

function displayProducts(productsToShow) {
    if (!productsGrid) return;
    
    productsGrid.innerHTML = '';

    productsToShow.forEach(product => {
        const isSold = product.sold;
        const isOutOfStock = product.outOfStock;

        let badgeClass = 'hidden';
        let badgeText = '';

        if (isSold) {
            badgeClass = 'badge-sold';
            badgeText = 'SOLD';
        } else if (product.tag === 'new') {
            badgeClass = 'badge-new';
            badgeText = 'NEW';
        } else if (product.tag === 'sale') {
            badgeClass = 'badge-sale';
            badgeText = 'SALE';
        }

        let buttonText = 'Add to Cart';
        let buttonClass = 'btn-add-to-cart add-to-cart';
        let buyNowText = 'Buy Now';
        let buyNowClass = 'btn-buy-now buy-now';
        let isDisabled = '';

        if (isSold) {
            buttonText = 'SOLD';
            buttonClass = 'btn-sold';
            buyNowText = 'SOLD';
            buyNowClass = 'btn-sold';
            isDisabled = 'disabled';
        } else if (isOutOfStock) {
            buttonText = 'Out of Stock';
            buttonClass = 'btn-secondary';
            buyNowText = 'Out of Stock';
            buyNowClass = 'btn-secondary';
            isDisabled = 'disabled';
        }

        const productHTML = `
            <div class="product-card" data-category="${product.category}">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}">
                    ${badgeClass !== 'hidden' ? `<span class="product-badge ${badgeClass}">${badgeText}</span>` : ''} 
                </div>
                <div class="product-info">
                    <p class="product-category">${product.category}</p>
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-price">${formatCurrency(product.price)}</p>
                    <p class="product-description">${product.description}</p>
                    <div class="product-actions">
                        <button class="btn ${buttonClass}" ${isDisabled} data-id="${product.id}">${buttonText}</button>
                        <button class="btn ${buyNowClass}" ${isDisabled} data-id="${product.id}">${buyNowText}</button>
                    </div>
                </div>
            </div>
        `;
        productsGrid.insertAdjacentHTML('beforeend', productHTML);
    });

    // 🔥 IMPORTANT: attach button listeners after rendering
    attachProductButtonEvents();
}



// ===================================================
// ADD THIS: FILTER & SEARCH FUNCTIONS
// ===================================================

function filterProducts(category) {
    if (!products || products.length === 0) return;

    let filtered = [];

    if (category === "all") {
        filtered = products;
    } else {
        filtered = products.filter(p =>
            p.category.toLowerCase() === category.toLowerCase()
        );
    }

    displayProducts(filtered);
}

function searchProducts(query) {
    const text = query.toLowerCase();

    const filtered = products.filter(product =>
        product.name.toLowerCase().includes(text) ||
        product.category.toLowerCase().includes(text) ||
        product.description.toLowerCase().includes(text)
    );

    displayProducts(filtered);
}



// ===================================================
// ADD THIS: Re-attach button events(Add to cart and buy now handler)
// ===================================================

function attachProductButtonEvents() {
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            addToCart(id);
        });
    });

    document.querySelectorAll('.buy-now').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            addToCart(id, 1);
            openCartModal();
        });
    });
}
     /*  Search icon click function */
document.getElementById('searchIcon').addEventListener('click', function () {
    const input = document.getElementById('searchInput');

    if (input) {
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        input.focus();
    }
});

// ===================================================
// 4. PAYSTACK INTEGRATION AND CHECKOUT
// ===================================================

function initiatePaystackPayment() {
    // untouched...
}



// ===================================================
// 5. MODAL CONTROL
// ===================================================

function openCartModal() {
    if (cartModal) {
        cartModal.style.display = 'block';
        updateCartUI(); 
    }
}

function closeCartModal() {
    if (cartModal) {
        cartModal.style.display = 'none';
    }
}



// ===================================================
// 6. INITIALIZATION AND EVENT LISTENERS
// ===================================================

async function initializeApp() {
    try {
        const response = await fetch('products.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        products = await response.json(); 
        
        displayProducts(products); 
        setupFilterListeners();
        updateCartUI();

    } catch (e) {
        console.error("Could not load product data:", e);
        products = []; 
        updateCartUI();
        displayProducts(products);
    }
}

function setupFilterListeners() {
    if (filterButtons) {
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                filterProducts(button.dataset.category);
            });
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchProducts(e.target.value);
        });
    }

    if (cartIcon) cartIcon.addEventListener('click', openCartModal);
    if (checkoutButton) checkoutButton.addEventListener('click', initiatePaystackPayment);
    if (closeModal) closeModal.addEventListener('click', closeCartModal);
    if (continueShoppingButton) continueShoppingButton.addEventListener('click', closeCartModal);

    window.addEventListener('click', (e) => {
        if (cartModal && e.target === cartModal) closeCartModal();
    });

    if (categoryCards) {
        categoryCards.forEach(card => {
            card.addEventListener('click', () => {
                const category = card.dataset.category;
                filterProducts(category);

                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.category === category) btn.classList.add('active');
                });
                
                document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
            });
        });
    }
}

initializeApp();
