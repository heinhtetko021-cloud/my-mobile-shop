// Placeholder default products images 
const defaultProducts = [];

const CART_KEY = 'hein_cart';
const DARK_MODE_KEY = 'hein_dark_mode';
const ADMIN_PASSWORD = 'hein2026';

let products = JSON.parse(localStorage.getItem('hein_products')) || defaultProducts;
let orders = JSON.parse(localStorage.getItem('hein_orders')) || [];
let cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
let currentFilterState = {
    query: '',
    category: '',
    sort: '',
    maxPrice: 25000000
};

function loadFilterState() {
    try {
        const saved = JSON.parse(localStorage.getItem('hein_filters') || 'null');
        if (!saved) return;
        currentFilterState = { ...currentFilterState, ...saved };
        const pr = document.getElementById('price-range');
        const pv = document.getElementById('price-range-value');
        const si = document.getElementById('search-input');
        const cf = document.getElementById('category-filter');
        const ps = document.getElementById('price-sort');
        if (pr) pr.value = currentFilterState.maxPrice;
        if (pv) pv.innerText = `${formatMoney(currentFilterState.maxPrice)} MMK`;
        if (si) si.value = currentFilterState.query || '';
        if (cf) cf.value = currentFilterState.category || '';
        if (ps) ps.value = currentFilterState.sort || '';
    } catch (e) {
        console.error('Failed to load saved filters', e);
    }
}

function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function formatMoney(value) {
    return Number(value).toLocaleString();
}

function loadDarkMode() {
    const save = localStorage.getItem(DARK_MODE_KEY);
    if (save === 'true') {
        document.body.classList.add('dark-mode');
        document.getElementById('mode-toggle').innerText = '☀️ Light Mode';
    }
}

function saveDarkMode() {
    localStorage.setItem(DARK_MODE_KEY, document.body.classList.contains('dark-mode'));
}

function toggleDarkMode() {
    const toggleBtn = document.getElementById('mode-toggle');
    document.body.classList.toggle('dark-mode');
    toggleBtn.innerText = document.body.classList.contains('dark-mode') ? "☀️ Light Mode" : "🌙 Dark Mode";
    saveDarkMode();
}

const toggleBtn = document.getElementById('mode-toggle');
if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleDarkMode);
}

// Render Products to Frontend UI
function getFilteredProducts() {
    const query = currentFilterState.query.toLowerCase();
    const category = currentFilterState.category;
    const maxPrice = currentFilterState.maxPrice;
    const sort = currentFilterState.sort;

    let filtered = products.filter(p => {
        const matchesQuery = p.name.toLowerCase().includes(query) || (p.desc || '').toLowerCase().includes(query) || p.category.toLowerCase().includes(query);
        const matchesCategory = !category || p.category === category;
        const matchesPrice = p.price <= maxPrice;
        return matchesQuery && matchesCategory && matchesPrice;
    });

    if (sort === 'low-high') {
        filtered.sort((a,b) => a.price - b.price);
    } else if (sort === 'high-low') {
        filtered.sort((a,b) => b.price - a.price);
    }

    return filtered;
}

function renderFrontendProducts(filteredProducts = null) {
    const container = document.getElementById('products-list-ui');
    container.innerHTML = "";
    const list = filteredProducts || getFilteredProducts();

    if (!list.length) {
        container.innerHTML = `<p class="empty-products">No products match your filters.</p>`;
        return;
    }

    list.forEach(p => {
        const nameText = JSON.stringify(p.name);
        const descText = JSON.stringify(p.desc || "No details available.");
        const imgText = JSON.stringify(p.img);

        container.innerHTML += `
            <div class="product-card">
                <div class="product-card-category">${p.category || 'General'}</div>
                <img src="${p.img}" alt="${p.name}"> 
                <h3>${p.name}</h3>
                <p class="price">${formatMoney(p.price)} MMK</p>
                <div class="product-card-actions" style="display:flex; flex-direction:column; gap:5px;">
                    <button class="view-btn" onclick='showDetails(${p.id}, ${nameText}, ${p.price}, ${imgText}, ${descText})'>View Details</button>
                    <button class="add-btn" onclick="addToCart(${p.id})">🛒 Add to Cart</button>
                    <button class="buy-now" onclick="buyNow(${p.id})">Buy Now</button>
                </div>
            </div>
        `;
    });
}

// Quick buy: set cart to single item and open checkout
function buyNow(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    cart = [{ ...product, quantity: 1 }];
    saveCart();
    updateCartUI();

    calculatedTotal = product.price;
    bulkSummaryText = `- ${product.name} (Qty:1)`;

    document.getElementById('checkout-section').style.display = 'block';
    document.getElementById('phone-model').value = product.name + ' (Qty:1)';
    document.getElementById('order-amount').value = formatMoney(calculatedTotal) + ' MMK';
    document.getElementById('user-name').focus();
    showToast(product.name + ' ready for quick checkout');
    window.scrollTo({ top: document.getElementById('checkout-section').offsetTop - 100, behavior: 'smooth' });
}

function showToast(message, duration = 2500) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.innerText = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
}

function applyFilterState() {
    const query = document.getElementById('search-input').value.trim();
    const category = document.getElementById('category-filter').value;
    const sort = document.getElementById('price-sort').value;
    const maxPriceInput = document.getElementById('price-range');
    const maxPrice = Number(maxPriceInput.value);

    currentFilterState = { query, category, sort, maxPrice };
    document.getElementById('price-range-value').innerText = `${formatMoney(maxPrice)} MMK`;
    if (maxPriceInput) maxPriceInput.title = `${formatMoney(maxPrice)} MMK`;
    renderFrontendProducts();
    try { localStorage.setItem('hein_filters', JSON.stringify(currentFilterState)); } catch(e) { console.error('Could not save filters', e); }
}

function setPaymentInstructions() {
    const method = document.getElementById('payment-method').value;
    const instructions = document.getElementById('payment-instructions');
    if (!instructions) return;

    if (method === 'KBZ PAY') {
        instructions.innerHTML = `<strong>KBZ PAY</strong> transfer to <code>09 69245 4680</code>. Save and upload your screenshot.`;
    } else {
        instructions.innerHTML = `<strong>Wave Pay</strong> transfer to <code>09 42000 3781</code>. Save and upload your screenshot.`;
    }
}

function enterAdmin() {
    const password = prompt('Enter admin password:');
    if (password === ADMIN_PASSWORD) {
        document.getElementById('admin-dashboard').style.display = 'flex';
        renderAdminProducts();
        renderAdminOrders();
    } else if (password !== null) {
        alert('Incorrect admin password.');
    }
}

function startProductEdit(index) {
    const product = products[index];
    if (!product) return;
    document.getElementById('admin-p-name').value = product.name;
    document.getElementById('admin-p-price').value = product.price;
    document.getElementById('admin-p-category').value = product.category || 'Other';
    document.getElementById('admin-p-desc').value = product.desc;
    document.getElementById('admin-edit-id').value = product.id;
    document.getElementById('admin-save-btn').innerText = 'Update Product';
}

function cancelProductEdit() {
    document.getElementById('admin-p-name').value = '';
    document.getElementById('admin-p-price').value = '';
    document.getElementById('admin-p-category').value = 'Apple';
    document.getElementById('admin-p-desc').value = '';
    document.getElementById('admin-p-image').value = '';
    document.getElementById('admin-edit-id').value = '';
    document.getElementById('admin-save-btn').innerText = 'Save Product';
}

function saveProduct() {
    const name = document.getElementById('admin-p-name').value.trim();
    const price = parseFloat(document.getElementById('admin-p-price').value);
    const category = document.getElementById('admin-p-category').value;
    const fileInput = document.getElementById('admin-p-image');
    const desc = document.getElementById('admin-p-desc').value.trim();
    const editId = Number(document.getElementById('admin-edit-id').value || 0);

    if(!name || !price) { alert('Please enter name and price!'); return; }

    const saveProductData = imgSource => {
        if (editId) {
            const product = products.find(p => p.id === editId);
            if (product) {
                product.name = name;
                product.price = price;
                product.category = category;
                product.desc = desc || 'No details available.';
                if (imgSource) product.img = imgSource;
            }
            showToast('Product updated successfully');
        } else {
            products.push({ id: Date.now(), name, price, category, img: imgSource, desc: desc || 'No details available.' });
            showToast('Product added successfully');
        }

        localStorage.setItem('hein_products', JSON.stringify(products));
        cancelProductEdit();
        renderAdminProducts();
        renderFrontendProducts();
    };

    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            saveProductData(e.target.result);
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else if (editId) {
        saveProductData();
    } else {
        saveProductData('https://via.placeholder.com/180?text=No+Image');
    }
}

function renderAdminProducts() {
    const tbody = document.getElementById('admin-products-table-body');
    tbody.innerHTML = "";
    products.forEach((p, index) => {
        tbody.innerHTML += `
            <tr>
                <td>${p.name}</td>
                <td>${formatMoney(p.price)}</td>
                <td>${p.category || 'General'}</td>
                <td><button onclick="startProductEdit(${index})" style="background:#007bff; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; margin-right:5px;">Edit</button><button onclick="deleteProduct(${index})" style="background:#dc3545; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">Delete</button></td>
            </tr>
        `;
    });
}

function deleteProduct(index) {
    if (!confirm('Delete this product?')) return;
    products.splice(index, 1);
    localStorage.setItem('hein_products', JSON.stringify(products));
    renderAdminProducts();
    renderFrontendProducts();
    showToast('Product removed successfully');
}

// Detail Modal Trigger
function showDetails(id, name, price, img, desc) {
    document.getElementById('modal-p-name').innerText = name;
    document.getElementById('modal-p-img').src = img;
    document.getElementById('modal-p-price').innerText = price.toLocaleString() + " MMK";
    document.getElementById('modal-p-desc').innerText = desc;
    
    document.getElementById('modal-add-cart-btn').onclick = function() {
        closeDetails();
        addToCart(id);
    };

    document.getElementById('detail-modal').style.display = 'flex';
}

function closeDetails() {
    document.getElementById('detail-modal').style.display = 'none';
}

// --- ADD TO CART LOGIC SYSTEM ---
function toggleCart(openState) {
    const sidebar = document.getElementById('cart-sidebar-panel');
    if (openState) sidebar.classList.add('open');
    else sidebar.classList.remove('open');
}

function addToCart(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    updateCartUI();
    toggleCart(true); // ပစ္စည်းထည့်ပြီးရင် ခြင်းတောင်းပြိုင်တူပွင့်လာမယ်
    showToast(`${product.name} added to cart`);
}

function changeQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
        cart = cart.filter(i => i.id !== id);
    }
    updateCartUI();
}

function updateCartUI() {
    const wrapper = document.getElementById('cart-items-wrapper');
    const countBadge = document.getElementById('cart-global-count');
    const totalText = document.getElementById('cart-total-price-text');
    const mobileBtn = document.getElementById('mobile-checkout-btn');
    
    wrapper.innerHTML = "";
    let totalItems = 0;
    let totalPrice = 0;

    if (!cart.length) {
        wrapper.innerHTML = `<p class="cart-empty">Your cart is empty.</p>`;
    }

    cart.forEach(item => {
        totalItems += item.quantity;
        totalPrice += (item.price * item.quantity);

        wrapper.innerHTML += `
            <div class="cart-item">
                <img src="${item.img}">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>${formatMoney(item.price * item.quantity)} MMK</p>
                    <div class="cart-qty-controls">
                        <button class="cart-qty-btn" onclick="changeQty(${item.id}, -1)">-</button>
                        <span style="font-weight:bold; font-size:14px; margin: 0 5px;">${item.quantity}</span>
                        <button class="cart-qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
                    </div>
                </div>
            </div>
        `;
    });

    countBadge.innerText = totalItems;
    totalText.innerText = formatMoney(totalPrice) + " MMK";
    saveCart();
    if (mobileBtn) {
        if (totalItems > 0) mobileBtn.classList.add('show');
        else mobileBtn.classList.remove('show');
    }
}

function bindFilterEvents() {
    const inputs = [
        document.getElementById('search-input'),
        document.getElementById('category-filter'),
        document.getElementById('price-sort'),
        document.getElementById('price-range')
    ];
    inputs.forEach(el => {
        if (!el) return;
        el.addEventListener('input', applyFilterState);
        el.addEventListener('change', applyFilterState);
    });
}

let calculatedTotal = 0;
let bulkSummaryText = "";

// Checkout Trigger for Cart
function triggerCartCheckout() {
    if (cart.length === 0) { alert("Your cart is empty!"); return; }
    toggleCart(false);

    calculatedTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    bulkSummaryText = cart.map(item => `- ${item.name} (Qty: ${item.quantity})`).join("\n");

    document.getElementById('checkout-section').style.display = 'block';
    document.getElementById('phone-model').value = bulkSummaryText;
    document.getElementById('order-amount').value = calculatedTotal.toLocaleString() + " MMK";

    window.scrollTo({top: document.getElementById('checkout-section').offsetTop - 100, behavior: 'smooth'});
    document.getElementById('user-name').focus();
}

function closeCheckout() { document.getElementById('checkout-section').style.display = 'none'; }

// 🌟 UPDATED FEATURE: ORDER ID GENERATOR
function generateVoucher() {
    const name = document.getElementById('user-name').value.trim();
    const phone = document.getElementById('user-phone').value.trim();
    const address = document.getElementById('user-address').value.trim();
    const method = document.getElementById('payment-method').value;
    const screenshotInput = document.getElementById('payment-screenshot');

    if(name === "" || phone === "" || address === "") {
        alert("Please fill all information!");
        return; 
    }
    if (screenshotInput.files.length === 0) {
        alert("Please upload your payment screenshot!");
        return;
    }

    if (!cart.length) {
        alert("Your cart is empty. Add items before confirming the order.");
        return;
    }

    // 🔑 Unique Order ID Generator (#HHK-260617-4839 ပုံစံမျိုး ထွက်လာပါမယ်)
    const dateObj = new Date();
    const dateStr = dateObj.toISOString().slice(2,10).replace(/-/g,""); // YYMMDD
    const randomStr = Math.floor(1000 + Math.random() * 9000); // 4 Digit Random
    const orderId = `HHK-${dateStr}-${randomStr}`;

    const orderLogsSummary = cart.map(item => `${item.name}(x${item.quantity})`).join(", ");
    
    const newOrder = {
        id: orderId,
        date: dateObj.toLocaleString(),
        name: name,
        item: orderLogsSummary,
        total: formatMoney(calculatedTotal) + " MMK",
        method: method
    };
    orders.push(newOrder);
    localStorage.setItem('hein_orders', JSON.stringify(orders));
    renderAdminOrders();

    // Telegram Bot ဆီသို့ Order ID လှမ်းပို့ပေးခြင်း
    confirmOrder(orderId, name, phone, address, bulkSummaryText, calculatedTotal, screenshotInput.files[0]);

    // UI Voucher Modal အတွင်းသို့ Data များ သွားရောက်ပြသခြင်း
    document.getElementById('v-id').innerText = orderId;
    document.getElementById('v-date').innerText = newOrder.date;
    document.getElementById('v-name').innerText = name;
    document.getElementById('v-phone').innerText = phone;
    document.getElementById('v-address').innerText = address;
    document.getElementById('v-method').innerText = method;
    document.getElementById('v-amount').innerText = formatMoney(calculatedTotal);
    document.getElementById('v-items-list-box').innerText = bulkSummaryText;
    document.getElementById('voucher-modal').style.display = 'flex';
}

// 🌟 UPDATED FEATURE: TELEGRAM INVOICE SETTING
function confirmOrder(orderId, name, phone, address, summary, amount, imageFile) {
    const token = "8716961719:AAGl1c-JQ9pdIhu0-SkRU4yk8-IPYowYz20"; 
    const chat_id = "8390911265"; 

    // 📄 စနစ်တကျ ပြုပြင်ထားသော Invoice Caption Format 
    const captionMessage = `<b>🧾 INVOICE RECEIVED</b>\n` +
                           `<code>🆔 Order ID: #${orderId}</code>\n` +
                           `----------------------------------\n\n` +
                           `🛒 <b>ITEMS LIST:</b>\n${summary}\n\n` +
                           `💰 <b>TOTAL BILL:</b> <u>${amount.toLocaleString()} MMK</u>\n` +
                           `💳 <b>PAYMENT VIA:</b> ${document.getElementById('payment-method').value}\n\n` +
                           `----------------------------------\n` +
                           `👤 <b>CUSTOMER DETAILS:</b>\n` +
                           `• <b>Name:</b> ${name}\n` +
                           `• <b>Phone:</b> ${phone}\n` +
                           `• <b>Address:</b> ${address}\n\n` +
                           `📅 <i>Time: ${new Date().toLocaleString()}</i>`;

    const formData = new FormData();
    formData.append('chat_id', chat_id);
    formData.append('photo', imageFile);
    formData.append('caption', captionMessage);
    formData.append('parse_mode', 'HTML');

    fetch(`https://api.telegram.org/bot${token}/sendPhoto`, { method: 'POST', body: formData })
    .catch(err => console.error("Telegram Error:", err));
}

function closeVoucher() {
    document.getElementById('voucher-modal').style.display = 'none';
    document.getElementById('checkout-section').style.display = 'none'; 
    cart = []; // Reset Cart state
    updateCartUI();
    document.getElementById('user-name').value = "";
    document.getElementById('user-phone').value = "";
    document.getElementById('user-address').value = "";
    document.getElementById('payment-screenshot').value = "";
}

function emptyCart() {
    if (!cart.length) return;
    if (confirm('Remove all items from your cart?')) {
        cart = [];
        updateCartUI();
    }
}

// --- ADMIN DASHBOARD CORE SYSTEM ---
const secretTrigger = document.getElementById('footer-secret-trigger');
secretTrigger.addEventListener('click', (e) => {
    if (e.detail === 3) {
        enterAdmin();
    }
});

function closeAdmin() { document.getElementById('admin-dashboard').style.display = 'none'; }

function switchTab(panelId, btn) {
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(panelId).classList.add('active');
    btn.classList.add('active');
}

function renderAdminOrders() {
    const tbody = document.getElementById('admin-orders-table-body');
    if (!tbody) return;

    tbody.innerHTML = "";
    [...orders].reverse().forEach(o => {
        tbody.innerHTML += `
            <tr>
                <td style="font-weight:bold; color:#007bff;">${o.id || 'N/A'}</td>
                <td>${o.date}</td>
                <td>${o.name}</td>
                <td style="font-size:12px; white-space:pre-line;">${o.item}</td>
                <td>${o.total}</td>
                <td>${o.method}</td>
            </tr>
        `;
    });
}

function clearOrders() {
    if(confirm("Clear all order logs?")) {
        orders = [];
        localStorage.setItem('hein_orders', JSON.stringify(orders));
        renderAdminOrders();
    }
}

document.getElementById('payment-method').addEventListener('change', function() {
    const shopNumberInput = document.getElementById('shop-payment-number');
    shopNumberInput.value = (this.value === 'KBZ PAY') ? '09 69245 4680 (Kpay Name)' : '09 42000 3781 (Wave Name)';
    setPaymentInstructions();
});

function hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = 'none';
}

const detailModal = document.getElementById('detail-modal');
if (detailModal) {
    detailModal.addEventListener('click', (e) => {
        if (e.target === detailModal) closeDetails();
    });
}

const voucherModal = document.getElementById('voucher-modal');
if (voucherModal) {
    voucherModal.addEventListener('click', (e) => {
        if (e.target === voucherModal) closeVoucher();
    });
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeDetails();
        closeVoucher();
        toggleCart(false);
        closeAdmin();
    }
});

loadDarkMode();
loadFilterState();
bindFilterEvents();
setPaymentInstructions();
applyFilterState();
renderAdminOrders();
updateCartUI();
hideLoadingOverlay();