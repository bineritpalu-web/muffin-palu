const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.querySelector('.site-nav');
const searchToggle = document.getElementById('searchToggle');
const searchModal = document.getElementById('searchModal');
const closeSearch = document.getElementById('closeSearch');
const cartToggle = document.getElementById('cartToggle');
const cartPanel = document.getElementById('cartPanel');
const closeCart = document.getElementById('closeCart');
const cartCount = document.getElementById('cartCount');
const cartItems = document.querySelector('.cart-items');
const themeToggle = document.getElementById('themeToggle');
const testimonialItems = Array.from(document.querySelectorAll('.testimonial'));
const backToTop = document.querySelector('.back-to-top');
const addToCartButtons = document.querySelectorAll('.add-to-cart');
const quantityInput = document.getElementById('quantity');
const qtyButtons = document.querySelectorAll('.qty-btn');
const whatsappOrderButton = document.getElementById('whatsappOrderButton');
const cartWhatsappButton = document.getElementById('cartWhatsappButton');
const stockReadyValue = document.getElementById('stockReadyValue');
const stockTargetValue = document.getElementById('stockTargetValue');
const stockProgressBar = document.getElementById('stockProgressBar');
const stockStatus = document.getElementById('stockStatus');
const omzetValue = document.getElementById('omzetValue');
const dailySalesValue = document.getElementById('dailySalesValue');
const incomeValue = document.getElementById('incomeValue');
const expenseValue = document.getElementById('expenseValue');
const profitValue = document.getElementById('profitValue');
const receiptList = document.getElementById('receiptList');
const financeList = document.getElementById('financeList');
const dashboardMessage = document.getElementById('dashboardMessage');
const stockForm = document.getElementById('stockForm');
const saleForm = document.getElementById('saleForm');
const expenseForm = document.getElementById('expenseForm');
const stockDeltaInput = document.getElementById('stockDelta');
const stockTargetInput = document.getElementById('stockTargetInput');
const saleAmountInput = document.getElementById('saleAmount');
const saleCustomerInput = document.getElementById('saleCustomer');
const saleNoteInput = document.getElementById('saleNote');
const expenseAmountInput = document.getElementById('expenseAmount');
const expenseNoteInput = document.getElementById('expenseNote');
const adminShell = document.getElementById('adminShell');
const loginShell = document.getElementById('loginShell');
const adminLoginForm = document.getElementById('adminLoginForm');
const loginUsernameInput = document.getElementById('loginUsername');
const loginPasswordInput = document.getElementById('loginPassword');
const loginMessage = document.getElementById('loginMessage');
const adminLogoutButton = document.getElementById('adminLogoutButton');
const resetStockButton = document.getElementById('resetStockButton');
const resetSalesButton = document.getElementById('resetSalesButton');
const resetFinanceButton = document.getElementById('resetFinanceButton');

let cart = [];
let dashboardState = null;
let isSyncingDashboard = false;

const STORAGE_KEY = 'muffin-dashboard-state';
const AUTH_STORAGE_KEY = 'muffin-admin-auth';
const ADMIN_CREDENTIALS = [
  { username: 'admin', password: 'muffinpalu2026' },
  { username: 'admin', password: 'admin' }
];

function getDefaultDashboardState() {
  return {
    stockReady: 120,
    stockTarget: 150,
    sales: [
      { id: 'STRK-001', customer: 'Bapak Rudi', amount: 280000, note: '10 box', time: '2026-07-14 09:30' },
      { id: 'STRK-002', customer: 'Keluarga Ana', amount: 160000, note: '5 box', time: '2026-07-13 16:10' }
    ],
    expenses: [
      { id: 'EXP-001', amount: 95000, note: 'Beli coklat premium', time: '2026-07-14 07:45' }
    ],
  };
}

function getDashboardState() {
  if (dashboardState) {
    return dashboardState;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      dashboardState = JSON.parse(stored);
      return dashboardState;
    }
  } catch (error) {
    console.warn('Unable to load dashboard state from localStorage', error);
  }

  dashboardState = getDefaultDashboardState();
  return dashboardState;
}

async function fetchDashboardState() {
  if (isSyncingDashboard) {
    return getDashboardState();
  }

  isSyncingDashboard = true;

  try {
    const response = await fetch('/api/dashboard-state');
    if (!response.ok) {
      throw new Error('Unable to load server state');
    }

    const data = await response.json();
    dashboardState = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dashboardState));
    return dashboardState;
  } catch (error) {
    console.warn('Falling back to browser storage for dashboard state', error);
    return getDashboardState();
  } finally {
    isSyncingDashboard = false;
  }
}

async function saveDashboardState() {
  const state = getDashboardState();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  try {
    await fetch('/api/dashboard-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    });
  } catch (error) {
    console.warn('Unable to sync dashboard state to server', error);
  }
}

function isAuthenticated() {
  return localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
}

function setAuthenticated(value) {
  localStorage.setItem(AUTH_STORAGE_KEY, value ? 'true' : 'false');
  return value;
}

function toggleAdminView() {
  if (!loginShell || !adminShell) return;

  if (isAuthenticated()) {
    loginShell.classList.add('hidden');
    adminShell.classList.remove('hidden');
    document.body.dataset.adminState = 'logged-in';
  } else {
    loginShell.classList.remove('hidden');
    adminShell.classList.add('hidden');
    document.body.dataset.adminState = 'logged-out';
  }
}

function showLoginMessage(text, isError = false) {
  if (!loginMessage) return;
  loginMessage.textContent = text;
  loginMessage.style.color = isError ? '#c62828' : '#4e342e';
}

function authenticateAdmin(username, password) {
  const normalizedUsername = (username || '').trim().toLowerCase();
  const normalizedPassword = (password || '').trim();

  return ADMIN_CREDENTIALS.some((credential) => {
    return credential.username.toLowerCase() === normalizedUsername && credential.password === normalizedPassword;
  });
}

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(value);
}

function updateDashboardUI() {
  if (!stockReadyValue || !stockTargetValue || !stockProgressBar || !stockStatus || !omzetValue || !dailySalesValue || !incomeValue || !expenseValue || !profitValue || !receiptList || !financeList || !stockTargetInput) {
    return;
  }

  const state = getDashboardState();
  const totalSales = state.sales.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalExpenses = state.expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const profit = totalSales - totalExpenses;
  const stockPercent = Math.min(100, Math.round((state.stockReady / Math.max(1, state.stockTarget)) * 100));

  stockReadyValue.textContent = `${state.stockReady} pcs`;
  stockTargetValue.textContent = `${state.stockTarget} pcs`;
  stockTargetInput.value = state.stockTarget;
  stockProgressBar.style.width = `${stockPercent}%`;
  omzetValue.textContent = formatCurrency(totalSales);
  dailySalesValue.textContent = formatCurrency(state.sales[0]?.amount || 0);
  incomeValue.textContent = formatCurrency(totalSales);
  expenseValue.textContent = formatCurrency(totalExpenses);
  profitValue.textContent = formatCurrency(profit);

  if (stockPercent >= 80) {
    stockStatus.textContent = 'Aman';
    stockStatus.className = 'status-pill';
  } else if (stockPercent >= 50) {
    stockStatus.textContent = 'Perlu restock';
    stockStatus.className = 'status-pill warning';
  } else {
    stockStatus.textContent = 'Kritis';
    stockStatus.className = 'status-pill danger';
  }

  renderReceipts();
  renderFinance();
}

function renderReceipts() {
  if (!receiptList) return;

  const state = getDashboardState();
  const receipts = [...state.sales].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

  if (!receipts.length) {
    receiptList.innerHTML = '<p class="empty-state">Belum ada struk penjualan.</p>';
    return;
  }

  receiptList.innerHTML = receipts.map((item) => `
    <div class="dashboard-item">
      <div>
        <strong>${item.customer || 'Pelanggan'}</strong>
        <small>${item.note || 'Tanpa catatan'} • ${item.time}</small>
      </div>
      <div class="dashboard-item-actions">
        <div class="dashboard-item-meta">
          <strong>${formatCurrency(item.amount)}</strong>
          <small>${item.id}</small>
        </div>
        <button class="button secondary" type="button" data-print-receipt="${item.id}">Cetak struk</button>
      </div>
    </div>
  `).join('');
}

function printReceipt(order) {
  if (!order) return;

  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) {
    showDashboardMessage('Popup diblokir. Izinkan popup untuk mencetak struk.');
    return;
  }

  const html = `<!DOCTYPE html>
  <html lang="id">
    <head>
      <meta charset="UTF-8" />
      <title>Struk ${order.id}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 24px; color: #2d1b14; }
        .receipt { max-width: 420px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 12px; }
        .title { text-align: center; font-size: 20px; font-weight: 700; margin-bottom: 8px; }
        .subtitle { text-align: center; color: #6f5649; margin-bottom: 16px; }
        .row { display: flex; justify-content: space-between; margin: 8px 0; }
        .divider { border-top: 1px dashed #999; margin: 12px 0; }
        .total { font-size: 18px; font-weight: 700; }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="title">MUFFIN PISANG COKLAT</div>
        <div class="subtitle">Palu • Struk Order</div>
        <div class="row"><span>ID Order</span><strong>${order.id}</strong></div>
        <div class="row"><span>Nama</span><strong>${order.customer || 'Pelanggan'}</strong></div>
        <div class="row"><span>Catatan</span><strong>${order.note || 'Tanpa catatan'}</strong></div>
        <div class="row"><span>Waktu</span><strong>${order.time || '-'}</strong></div>
        <div class="divider"></div>
        <div class="row"><span>Jumlah</span><strong>${formatCurrency(order.amount || 0)}</strong></div>
        <div class="divider"></div>
        <div class="row total"><span>Total</span><strong>${formatCurrency(order.amount || 0)}</strong></div>
      </div>
    </body>
  </html>`;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 300);
}

function renderFinance() {
  if (!financeList) return;

  const state = getDashboardState();
  const financeEntries = [
    ...state.sales.map((item) => ({ ...item, type: 'Pemasukan' })),
    ...state.expenses.map((item) => ({ ...item, type: 'Pengeluaran' }))
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8);

  if (!financeEntries.length) {
    financeList.innerHTML = '<p class="empty-state">Belum ada catatan keuangan.</p>';
    return;
  }

  financeList.innerHTML = financeEntries.map((item) => `
    <div class="dashboard-item">
      <div>
        <strong>${item.type}</strong>
        <small>${item.note || 'Tanpa catatan'} • ${item.time}</small>
      </div>
      <div>
        <strong>${formatCurrency(item.amount)}</strong>
        <small>${item.id}</small>
      </div>
    </div>
  `).join('');
}

if (receiptList) {
  receiptList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-print-receipt]');
    if (!button) {
      return;
    }

    const orderId = button.getAttribute('data-print-receipt');
    const state = getDashboardState();
    const order = state.sales.find((item) => item.id === orderId);
    if (order) {
      printReceipt(order);
    }
  });
}

function showDashboardMessage(text) {
  if (!dashboardMessage) return;
  dashboardMessage.textContent = text;
  window.setTimeout(() => {
    dashboardMessage.textContent = '';
  }, 2200);
}

stockForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const state = getDashboardState();
  const delta = Number(stockDeltaInput.value);
  const target = Number(stockTargetInput.value);

  if (Number.isFinite(delta)) {
    state.stockReady = Math.max(0, state.stockReady + delta);
  }

  if (Number.isFinite(target) && target > 0) {
    state.stockTarget = target;
  }

  await saveDashboardState();
  updateDashboardUI();
  updateOrderStockDisplay();
  showDashboardMessage('Stok berhasil diperbarui');
});

saleForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const state = getDashboardState();
  const amount = Number(saleAmountInput.value);
  const customer = saleCustomerInput.value.trim() || 'Pelanggan';
  const note = saleNoteInput.value.trim() || 'Penjualan';

  if (!Number.isFinite(amount) || amount <= 0) {
    showDashboardMessage('Nominal penjualan harus lebih dari nol');
    return;
  }

  state.sales.unshift({
    id: `STRK-${String(state.sales.length + 1).padStart(3, '0')}`,
    customer,
    amount,
    note,
    time: new Date().toLocaleString('id-ID')
  });

  await saveDashboardState();
  updateDashboardUI();
  updateOrderStockDisplay();
  saleForm.reset();
  showDashboardMessage('Penjualan berhasil dicatat');
});

expenseForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const state = getDashboardState();
  const amount = Number(expenseAmountInput.value);
  const note = expenseNoteInput.value.trim() || 'Pengeluaran';

  if (!Number.isFinite(amount) || amount <= 0) {
    showDashboardMessage('Nominal pengeluaran harus lebih dari nol');
    return;
  }

  state.expenses.unshift({
    id: `EXP-${String(state.expenses.length + 1).padStart(3, '0')}`,
    amount,
    note,
    time: new Date().toLocaleString('id-ID')
  });

  await saveDashboardState();
  updateDashboardUI();
  expenseForm.reset();
  showDashboardMessage('Pengeluaran berhasil dicatat');
});

if (adminLoginForm) {
  adminLoginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const username = loginUsernameInput?.value || '';
    const password = loginPasswordInput?.value || '';

    const valid = authenticateAdmin(username, password);
    if (valid) {
      setAuthenticated(true);
      toggleAdminView();
      updateDashboardUI();
      showLoginMessage('Login berhasil.');
    } else {
      showLoginMessage('Username atau password salah. Coba admin / muffinpalu2026.', true);
    }
  });
}

const loginSubmitButton = document.getElementById('loginSubmitButton');
loginSubmitButton?.addEventListener('click', () => {
  const username = loginUsernameInput?.value || '';
  const password = loginPasswordInput?.value || '';
  const valid = authenticateAdmin(username, password);

  if (valid) {
    setAuthenticated(true);
    toggleAdminView();
    updateDashboardUI();
    showLoginMessage('Login berhasil.');
  } else {
    showLoginMessage('Username atau password salah. Coba admin / muffinpalu2026.', true);
  }
});

adminLogoutButton?.addEventListener('click', () => {
  setAuthenticated(false);
  toggleAdminView();
  showLoginMessage('Anda telah logout.');
});

resetStockButton?.addEventListener('click', async () => {
  const state = getDashboardState();
  state.stockReady = 0;
  state.stockTarget = 150;
  await saveDashboardState();
  updateDashboardUI();
  updateOrderStockDisplay();
  showDashboardMessage('Stok berhasil direset');
});

resetSalesButton?.addEventListener('click', async () => {
  const state = getDashboardState();
  state.sales = [];
  await saveDashboardState();
  updateDashboardUI();
  showDashboardMessage('Riwayat penjualan berhasil direset');
});

resetFinanceButton?.addEventListener('click', async () => {
  const state = getDashboardState();
  state.expenses = [];
  await saveDashboardState();
  updateDashboardUI();
  showDashboardMessage('Laporan keuangan berhasil direset');
});

let currentTestimonial = 0;
let testimonialInterval;

function getQuantity() {
  const value = quantityInput ? Number(quantityInput.value) : 1;
  return Number.isInteger(value) && value > 0 ? value : 1;
}

function formatNumber(number) {
  return number.toLocaleString('id-ID');
}

function getProductTotal() {
  return getQuantity() * 5000;
}

function updateWhatsAppLinks() {
  const quantity = getQuantity();
  const total = getProductTotal();
  const message = `Halo saya ingin memesan ${quantity} Muffin Pisang Coklat (Total Rp ${formatNumber(total)}). Mohon infokan ketersediaan dan estimasi pengiriman.`;
  const encoded = encodeURIComponent(message);

  if (whatsappOrderButton) {
    whatsappOrderButton.href = `https://wa.me/6282259107121?text=${encoded}`;
  }

  const cartMessage = cart.length
    ? `Halo saya ingin memesan:\n${cart.map(item => `${item.quantity}x ${item.name} = Rp ${formatNumber(item.price * item.quantity)}`).join('\n')}\nTotal pesanan: Rp ${formatNumber(cart.reduce((sum, item) => sum + item.price * item.quantity, 0))}.`
    : 'Halo saya ingin memesan Muffin Pisang Coklat.';

  if (cartWhatsappButton) {
    cartWhatsappButton.href = `https://wa.me/6282259107121?text=${encodeURIComponent(cartMessage)}`;
  }
}

async function recordOrder(quantity, note = 'Pesanan online') {
  const state = getDashboardState();
  const actualQuantity = Math.min(Math.max(0, quantity), state.stockReady);
  if (actualQuantity <= 0) {
    return false;
  }

  state.sales.unshift({
    id: `ORD-${String(state.sales.length + 1).padStart(3, '0')}`,
    customer: 'Pelanggan',
    amount: actualQuantity * 5000,
    note,
    time: new Date().toLocaleString('id-ID')
  });

  state.stockReady = Math.max(0, state.stockReady - actualQuantity);
  await saveDashboardState();
  updateOrderStockDisplay();
  if (isAuthenticated()) {
    updateDashboardUI();
  }
  return true;
}

function updateOrderStockDisplay() {
  const buttons = [...addToCartButtons, whatsappOrderButton, cartWhatsappButton].filter(Boolean);

  buttons.forEach((button) => {
    if (!button) return;
    if (button instanceof HTMLAnchorElement) {
      button.classList.remove('disabled');
      button.setAttribute('href', button.id === 'whatsappOrderButton'
        ? `https://wa.me/6282259107121?text=${encodeURIComponent(`Halo saya ingin memesan ${getQuantity()} Muffin Pisang Coklat (Total Rp ${formatNumber(getProductTotal())}). Mohon infokan ketersediaan dan estimasi pengiriman.`)}`
        : `https://wa.me/6282259107121?text=${encodeURIComponent(cart.length
          ? `Halo saya ingin memesan:\n${cart.map(item => `${item.quantity}x ${item.name} = Rp ${formatNumber(item.price * item.quantity)}`).join('\n')}\nTotal pesanan: Rp ${formatNumber(cart.reduce((sum, item) => sum + item.price * item.quantity, 0))}.`
          : 'Halo saya ingin memesan Muffin Pisang Coklat.')}`);
      button.removeAttribute('aria-disabled');
    } else if (button instanceof HTMLButtonElement) {
      button.disabled = false;
      button.classList.remove('disabled');
    }
  });
}

function updateCartUI() {
  if (cartCount) {
    cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  if (!cartItems) {
    return;
  }

  if (!cart.length) {
    cartItems.innerHTML = '<p class="cart-empty">Keranjang Anda siap untuk pesanan bakery hangat.</p>';
    return;
  }

  cartItems.innerHTML = cart
    .map(
      (item, index) => `
        <div class="cart-item">
          <div class="cart-item-info">
            <strong>${item.name}</strong>
            <div>Qty: ${item.quantity}</div>
          </div>
          <div class="cart-item-actions">
            <div>Rp ${item.price * item.quantity}</div>
            <button type="button" class="cart-remove-btn" data-index="${index}" aria-label="Hapus ${item.name} dari keranjang">✕</button>
          </div>
        </div>
      `
    )
    .join('');
}

function openSearch() {
  searchModal.classList.add('open');
  searchModal.setAttribute('aria-hidden', 'false');
}

function closeSearchModal() {
  searchModal.classList.remove('open');
  searchModal.setAttribute('aria-hidden', 'true');
}

function openCart() {
  cartPanel.classList.add('open');
  cartPanel.setAttribute('aria-hidden', 'false');
}

function closeCartPanel() {
  cartPanel.classList.remove('open');
  cartPanel.setAttribute('aria-hidden', 'true');
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  themeToggle.textContent = isDark ? '🌙' : '☀️';
}

function showTestimonial(index) {
  testimonialItems.forEach((item, itemIndex) => {
    item.classList.toggle('active', itemIndex === index);
  });
}

function nextTestimonial() {
  currentTestimonial = (currentTestimonial + 1) % testimonialItems.length;
  showTestimonial(currentTestimonial);
}

function startCarousel() {
  clearInterval(testimonialInterval);
  testimonialInterval = setInterval(nextTestimonial, 6000);
}

navToggle?.addEventListener('click', () => {
  const expanded = navToggle.getAttribute('aria-expanded') === 'true';
  navToggle.setAttribute('aria-expanded', String(!expanded));
  siteNav.classList.toggle('open');
});

searchToggle?.addEventListener('click', openSearch);
closeSearch?.addEventListener('click', closeSearchModal);
searchModal?.addEventListener('click', (event) => {
  if (event.target === searchModal) closeSearchModal();
});

cartToggle?.addEventListener('click', openCart);
closeCart?.addEventListener('click', closeCartPanel);
cartPanel?.addEventListener('click', (event) => {
  if (event.target === cartPanel) closeCartPanel();
});
cartItems?.addEventListener('click', (event) => {
  const removeButton = event.target.closest('.cart-remove-btn');
  if (!removeButton) return;

  const index = Number(removeButton.dataset.index);
  if (Number.isInteger(index) && index >= 0 && index < cart.length) {
    cart.splice(index, 1);
    updateCartUI();
    updateWhatsAppLinks();
  }
});

themeToggle?.addEventListener('click', toggleTheme);

qtyButtons?.forEach((button) => {
  button.addEventListener('click', () => {
    const action = button.dataset.action;
    let quantity = getQuantity();
    quantity = action === 'increase' ? quantity + 1 : Math.max(1, quantity - 1);
    quantityInput.value = quantity;
    updateWhatsAppLinks();
    updateOrderStockDisplay();
  });
});

quantityInput?.addEventListener('input', () => {
  const quantity = getQuantity();
  quantityInput.value = quantity;
  updateWhatsAppLinks();
  updateOrderStockDisplay();
});

document.querySelector('.carousel-control.prev')?.addEventListener('click', () => {
  currentTestimonial = (currentTestimonial - 1 + testimonialItems.length) % testimonialItems.length;
  showTestimonial(currentTestimonial);
  startCarousel();
});

document.querySelector('.carousel-control.next')?.addEventListener('click', () => {
  nextTestimonial();
  startCarousel();
});

addToCartButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const name = button.dataset.name;
    const price = Number(button.dataset.price);
    const quantity = getQuantity();
    const existing = cart.find((item) => item.name === name);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({ name, price, quantity });
    }
    updateCartUI();
    updateWhatsAppLinks();
    openCart();
  });
});

whatsappOrderButton?.addEventListener('click', async (event) => {
  const quantity = getQuantity();
  const ordered = await recordOrder(quantity, 'Pesan via WhatsApp');
  if (!ordered) {
    event.preventDefault();
  }
});

cartWhatsappButton?.addEventListener('click', async (event) => {
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const ordered = await recordOrder(totalQuantity, 'Pesan keranjang via WhatsApp');
  if (totalQuantity <= 0 || !ordered) {
    event.preventDefault();
    return;
  }
  cart = [];
  updateCartUI();
  updateWhatsAppLinks();
});

const contactForms = document.querySelectorAll('.contact-form, .newsletter-form');
contactForms.forEach((form) => {
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      alert('Terima kasih! Kami akan segera menghubungi Anda.');
    });
  }
});

window.addEventListener('scroll', () => {
  if (backToTop) {
    backToTop.classList.toggle('show', window.scrollY > 500);
  }
});

if (backToTop) {
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEY) {
    dashboardState = null;
    updateOrderStockDisplay();
    if (isAuthenticated()) {
      updateDashboardUI();
    }
  }
});

showTestimonial(0);
startCarousel();
updateCartUI();
updateWhatsAppLinks();
updateOrderStockDisplay();
if (loginShell && adminShell) {
  toggleAdminView();
}
if (stockReadyValue && stockTargetValue && stockProgressBar && isAuthenticated()) {
  updateDashboardUI();
}

fetchDashboardState().then(() => {
  updateOrderStockDisplay();
  if (isAuthenticated()) {
    updateDashboardUI();
  }
});

window.setInterval(() => {
  fetchDashboardState().then(() => {
    updateOrderStockDisplay();
    if (isAuthenticated()) {
      updateDashboardUI();
    }
  });
}, 5000);
