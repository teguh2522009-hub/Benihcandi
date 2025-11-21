/* ===========================================================
   script.js — Benih Candi (Versi Final & Sederhana)
   =========================================================== */

/* =========================
   1. KONFIGURASI & KONSTANTA
   ========================= */
const CART_KEY = 'benihcandi_cart_v1';

/* =========================
   2. FUNGSI BANTUAN (HELPERS)
   ========================= */

/**
 * Format angka menjadi format Rupiah.
 */
function formatRp(n) {
  if (!n && n !== 0) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(n);
}

/**
 * Menampilkan notifikasi toast.
 */
function showToast(message, type = 'success', timeout = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, timeout);
}

/* =========================
   3. MANAJEMEN KERANJANG (CART)
   ========================= */

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : { items: [] };
  } catch (e) {
    console.error('Gagal memuat keranjang:', e);
    return { items: [] };
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartUI();
}

function findCartItemIndex(cart, id, name) {
  return cart.items.findIndex(it => (it.id && it.id === id) || (it.name && it.name === name));
}

function cartTotals(cart) {
  let total = 0, count = 0;
  cart.items.forEach(it => {
    total += (Number(it.price || 0) * Number(it.qty || 1));
    count += Number(it.qty || 1);
  });
  return { total, count };
}

function addToCart(productInfo) {
  console.log("Tombol Beli diklik! Produk:", productInfo); // Untuk debugging
  const cart = loadCart();
  const idx = findCartItemIndex(cart, productInfo.id, productInfo.name);
  
  if (idx > -1) {
    cart.items[idx].qty = Number(cart.items[idx].qty || 0) + Number(productInfo.qty || 1);
  } else {
    cart.items.push({
      id: productInfo.id || null,
      name: productInfo.name,
      price: Number(productInfo.price || 0),
      qty: Number(productInfo.qty || 1),
      img: productInfo.img || ''
    });
  }
  
  saveCart(cart);
  showToast(`${productInfo.name} berhasil ditambahkan ke keranjang!`);
  
  // Arahkan ke halaman keranjang setelah 1 detik
  setTimeout(() => {
    window.location.href = 'keranjang.html';
  }, 1000);
}

function updateCartUI() {
  const cart = loadCart();
  const totals = cartTotals(cart);
  
  const cartCountElements = document.querySelectorAll('.cart-count');
  cartCountElements.forEach(el => {
    el.textContent = totals.count;
    el.style.display = totals.count > 0 ? 'flex' : 'none';
  });
}

function bindAddToCartButtons() {
  document.querySelectorAll('.btn-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const btnEl = e.currentTarget;
      const name = btnEl.dataset.name;
      const price = btnEl.dataset.price;
      const id = btnEl.dataset.id;
      const img = btnEl.dataset.img;
      
      if (!name || !price) {
        showToast('Informasi produk tidak lengkap.', 'error');
        return;
      }
      addToCart({ id, name, price: Number(price), qty: 1, img });
    });
  });
}

/* =========================
   4. INISIALISASI PER HALAMAN
   ========================= */

/**
 * Inisialisasi fungsionalitas untuk halaman Keranjang (keranjang.html)
 */
function initCartPage() {
  const cartContainer = document.querySelector('.cart-container');
  const summaryBox = document.querySelector('.cart-summary');
  if (!cartContainer) return;

  function renderCart() {
    const cart = loadCart();
    cartContainer.innerHTML = '';

    if (cart.items.length === 0) {
      cartContainer.innerHTML = `
        <div class="empty-cart-message" style="grid-column: 1 / -1; text-align:center; padding:40px;">
          <h3>Keranjang Belanja Kosong</h3>
          <p>Yuk, tambah produk dari daftar produk!</p>
          <a href="produk.html" class="btn-primary">Belanja Sekarang</a>
        </div>`;
      if (summaryBox) summaryBox.style.display = 'none';
      updateCartUI();
      return;
    }

    cart.items.forEach((it, idx) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'cart-item';
      itemEl.innerHTML = `
        <img src="${it.img || 'images/produk/produk1.jpg'}" alt="${it.name}">
        <h4>${it.name}</h4>
        <span class="price">${formatRp(it.price)}</span>
        <input type="number" class="qty" value="${it.qty}" min="1" data-index="${idx}">
        <span class="total">${formatRp(it.price * it.qty)}</span>
        <button class="remove-btn" data-index="${idx}"><i class="fa fa-trash"></i></button>
      `;
      cartContainer.appendChild(itemEl);
    });

    if (summaryBox) {
      const totals = cartTotals(cart);
      summaryBox.querySelector('.subtotal').textContent = formatRp(totals.total);
      summaryBox.querySelector('.total-amount').textContent = formatRp(totals.total);
      summaryBox.style.display = 'block';
    }
    
    cartContainer.querySelectorAll('.qty').forEach(input => {
      input.addEventListener('change', (e) => {
        const idx = Number(e.target.dataset.index);
        const newQty = Number(e.target.value);
        if (newQty < 1) return;
        
        const cartNow = loadCart();
        cartNow.items[idx].qty = newQty;
        saveCart(cartNow);
        renderCart();
      });
    });

    cartContainer.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = Number(e.target.closest('button').dataset.index);
        const cartNow = loadCart();
        const removedItem = cartNow.items[idx];
        cartNow.items.splice(idx, 1);
        saveCart(cartNow);
        showToast(`${removedItem.name} dihapus dari keranjang`);
        renderCart();
      });
    });
  }

  renderCart();

  document.querySelector('.btn-clear')?.addEventListener('click', () => {
    if (confirm('Apakah Anda yakin ingin mengosongkan keranjang?')) {
      saveCart({ items: [] });
      renderCart();
      showToast('Keranjang dikosongkan');
    }
  });

  document.querySelector('.checkout-btn')?.addEventListener('click', () => {
    const cart = loadCart();
    if (cart.items.length === 0) {
      showToast('Keranjang Anda kosong', 'error');
      return;
    }
    showToast('Melanjutkan ke pembayaran... (Fitur ini masih simulasi)');
    console.log('Checkout Data:', cart);
  });
}

/**
 * Inisialisasi menu mobile (hamburger)
 */
function initMobileMenu() {
  const hamburger = document.querySelector('.hamburger');
  const navbar = document.querySelector('.navbar');
  if (!hamburger || !navbar) return;

  hamburger.addEventListener('click', () => {
    navbar.classList.toggle('nav-open');
  });
}

/* =========================
   5. EKSEKUSI UTAMA
   ========================= */
document.addEventListener('DOMContentLoaded', () => {
  // --- Global: Selalu dijalankan di SEMUA halaman ---
  updateCartUI();
  bindAddToCartButtons();
  initMobileMenu();

  // --- Spesifik Halaman: Hanya dijalankan jika elemennya ada ---
  initCartPage();
});