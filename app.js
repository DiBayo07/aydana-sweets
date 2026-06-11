let products = [];
let brands = [];
let cart = [];

async function loadProducts() {
  try {
    products = await window.fetchProducts();
    return products;
  } catch (error) {
    console.error('Ошибка загрузки товаров:', error);
    try {
      const res = await fetch('/data/products.json', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        products = (data || []).map((p) => ({
          ...p,
          brandName: p.brandName || p.brand,
          image:
            p.image ||
            'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=200',
          tags: p.tags || []
        }));
        showToast('Supabase недоступен — показаны локальные товары', 'error');
        return products;
      }
    } catch (_e) {
      // ignore
    }
    products = [];
    showToast(`Supabase: ${error.message}`, 'error');
    return [];
  }
}

function loadBrands() {
  const seen = new Map();
  products.forEach((p) => {
    if (!seen.has(p.brand)) {
      seen.set(p.brand, { id: p.brand, name: p.brandName || p.brand });
    }
  });
  brands = [...seen.values()];
  return brands;
}

async function loadAllData() {
  showToast('Загрузка товаров...');
  await loadProducts();
  loadBrands();
  renderCatalog();
  renderFeaturedProducts();
  renderBrandFilters();
  renderHistoryTimeline();
  updateCartCount();
  if (products.length) {
    showToast(`Загружено ${products.length} товаров`);
  } else {
    showToast('Товаров пока нет. Добавьте в админ-панели', 'error');
  }
}

// ==================== КАТАЛОГ ====================
let currentFilters = { types: [], categories: [], flavors: [], brands: [], maxPrice: 5000 };
let currentSort = 'default';

function renderCatalog() {
    const container = document.getElementById('catalog-products');
    const countSpan = document.getElementById('catalog-count');
    
    if (!container) {
        console.error('Контейнер catalog-products не найден');
        return;
    }
    
    console.log('Рендер каталога, товаров:', products.length);
    
    // Применяем фильтры
    let filtered = [...products];
    
    if (currentFilters.types.length) {
        filtered = filtered.filter(p => currentFilters.types.includes(p.type));
    }
    if (currentFilters.categories.length) {
        filtered = filtered.filter(p => currentFilters.categories.includes(p.category));
    }
    if (currentFilters.flavors.length) {
        filtered = filtered.filter(p => currentFilters.flavors.includes(p.flavor));
    }
    if (currentFilters.brands.length) {
        filtered = filtered.filter(p => currentFilters.brands.includes(p.brand));
    }
    filtered = filtered.filter(p => p.price <= currentFilters.maxPrice);
    
    // Сортировка
    if (currentSort === 'price-asc') filtered.sort((a,b) => a.price - b.price);
    else if (currentSort === 'price-desc') filtered.sort((a,b) => b.price - a.price);
    else if (currentSort === 'name') filtered.sort((a,b) => a.name.localeCompare(b.name));
    else if (currentSort === 'cacao') filtered.sort((a,b) => b.cacao - a.cacao);
    
    if (countSpan) countSpan.textContent = `${filtered.length} товаров`;
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="no-results">🍫 Ничего не найдено. Попробуйте изменить фильтры 🍫</div>';
        return;
    }
    
    // HTML для товаров
    container.innerHTML = filtered.map(p => `
        <div class="product-card" onclick="showProductModal(${p.id})">
            <div class="product-img">
                <img src="${p.image}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/200?text=🍫'">
            </div>
            <div class="product-body">
                <div class="product-brand">${p.brandName || p.brand}</div>
                <div class="product-name">${p.name}</div>
                <div class="product-desc">${(p.description || '').substring(0, 60)}...</div>
                <div class="product-meta">
                    <span class="product-cacao">${p.cacao || 0}% какао</span>
                    <span class="product-price">${p.price} сом</span>
                </div>
                <div class="product-actions">
                    <button class="btn-primary" onclick="event.stopPropagation(); addToCart(${p.id})">В корзину</button>
                </div>
            </div>
        </div>
    `).join('');
    
    console.log('Отрисовано товаров:', filtered.length);
}

// ==================== ХИТЫ ПРОДАЖ ====================
function renderFeaturedProducts() {
    const container = document.getElementById('featured-products');
    if (!container) return;
    
    const featured = products.filter(p => p.tags && p.tags.includes('хит')).slice(0, 4);
    console.log('Хиты продаж:', featured.length);
    
    if (featured.length === 0) {
        // Если нет хитов, показываем первые 4 товара
        const firstFour = products.slice(0, 4);
        if (firstFour.length) {
            container.innerHTML = firstFour.map(p => `
                <div class="product-card" onclick="showProductModal(${p.id})">
                    <div class="product-img"><img src="${p.image}" alt="${p.name}"></div>
                    <div class="product-body">
                        <div class="product-brand">${p.brandName || p.brand}</div>
                        <div class="product-name">${p.name}</div>
                        <div class="product-meta">
                            <span class="product-price">${p.price} сом</span>
                        </div>
                        <div class="product-actions">
                            <button class="btn-primary" onclick="event.stopPropagation(); addToCart(${p.id})">В корзину</button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
        return;
    }
    
    container.innerHTML = featured.map(p => `
        <div class="product-card" onclick="showProductModal(${p.id})">
            <div class="product-img"><img src="${p.image}" alt="${p.name}"></div>
            <div class="product-body">
                <div class="product-brand">${p.brandName || p.brand}</div>
                <div class="product-name">${p.name}</div>
                <div class="product-meta">
                    <span class="product-price">${p.price} сом</span>
                </div>
                <div class="product-actions">
                    <button class="btn-primary" onclick="event.stopPropagation(); addToCart(${p.id})">В корзину</button>
                </div>
            </div>
        </div>
    `).join('');
}

// ==================== ФИЛЬТРЫ ====================
function renderBrandFilters() {
    const container = document.getElementById('brand-filter-list');
    if (!container) return;
    
    container.innerHTML = brands.map(b => `
        <label class="brand-filter-item">
            <input type="checkbox" name="brand" value="${b.id}" onchange="applyFilters()">
            <span>${b.name}</span>
        </label>
    `).join('');
}

function applyFilters() {
    currentFilters.types = [...document.querySelectorAll('input[name="type"]:checked')].map(cb => cb.value);
    currentFilters.categories = [...document.querySelectorAll('input[name="cat"]:checked')].map(cb => cb.value);
    currentFilters.flavors = [...document.querySelectorAll('input[name="flavor"]:checked')].map(cb => cb.value);
    currentFilters.brands = [...document.querySelectorAll('input[name="brand"]:checked')].map(cb => cb.value);
    const priceMax = document.getElementById('price-max');
    if (priceMax) currentFilters.maxPrice = parseInt(priceMax.value);
    renderCatalog();
}

function applySort(sort) {
    currentSort = sort;
    renderCatalog();
}

function clearFilters() {
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    const priceMax = document.getElementById('price-max');
    if (priceMax) {
        priceMax.value = 5000;
        const label = document.getElementById('price-max-label');
        if (label) label.textContent = '5 000 сом';
    }
    currentFilters = { types: [], categories: [], flavors: [], brands: [], maxPrice: 5000 };
    renderCatalog();
}

function updatePriceFilter(val) {
    const label = document.getElementById('price-max-label');
    if (label) label.textContent = `${parseInt(val).toLocaleString()} сом`;
    applyFilters();
}

function toggleFilters() {
    const sidebar = document.getElementById('filters-sidebar');
    if (sidebar) sidebar.classList.toggle('open');
}

// ==================== КОРЗИНА ====================
function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const countEl = document.getElementById('cart-count');
    if (countEl) {
        countEl.textContent = count;
        countEl.classList.toggle('zero', count === 0);
    }
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    updateCartCount();
    showToast(`${product.name} добавлен в корзину 🛒`);
    renderCartModal();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartCount();
    renderCartModal();
}

function updateQuantity(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            updateCartCount();
            renderCartModal();
        }
    }
}

function renderCartModal() {
    const cartItemsDiv = document.getElementById('cart-items');
    const emptyDiv = document.getElementById('cart-empty');
    const footerDiv = document.getElementById('cart-footer');
    const totalSpan = document.getElementById('cart-total-price');
    
    if (!cartItemsDiv) return;
    
    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '';
        if (emptyDiv) emptyDiv.classList.remove('hidden');
        if (footerDiv) footerDiv.classList.add('hidden');
        return;
    }
    
    if (emptyDiv) emptyDiv.classList.add('hidden');
    if (footerDiv) footerDiv.classList.remove('hidden');
    
    cartItemsDiv.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-emoji"><img src="${item.image}" width="40" height="40" style="border-radius:8px; object-fit:cover;"></div>
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-brand">${item.brandName || item.brand}</div>
                <div class="cart-item-price">${item.price} сом</div>
            </div>
            <div class="cart-item-qty">
                <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                <span class="qty-num">${item.quantity}</span>
                <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart(${item.id})">🗑️</button>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (totalSpan) totalSpan.textContent = `${total} сом`;
}

// ==================== МОДАЛЬНЫЕ ОКНА ====================
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modal-overlay');
    if (modal) modal.classList.add('open');
    if (overlay) overlay.classList.add('open');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modal-overlay');
    if (modal) modal.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
}

function closeAllModals() {
    document.querySelectorAll('.modal.open').forEach(m => m.classList.remove('open'));
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.classList.remove('open');
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.style.background = type === 'error' ? '#C0392B' : '#2C1810';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function showProductModal(id) {
    const p = products.find(p => p.id === id);
    if (!p) return;
    
    const content = `
        <div class="product-modal-layout">
            <div class="product-modal-img"><img src="${p.image}" alt="${p.name}"></div>
            <div class="product-modal-info">
                <div class="product-modal-brand">${p.brandName || p.brand}</div>
                <h3>${p.name}</h3>
                <div class="product-modal-desc">${p.description || ''}</div>
                <div class="product-modal-tags">
                    <span class="product-tag">${p.type === 'dark' ? 'Тёмный' : p.type === 'milk' ? 'Молочный' : p.type === 'white' ? 'Белый' : 'Рубиновый'}</span>
                    <span class="product-tag cacao-tag">${p.cacao || 0}% какао</span>
                </div>
                <div class="product-modal-price">${p.price} сом</div>
                <div class="product-modal-actions">
                    <button class="btn-primary" onclick="addToCart(${p.id}); closeModal('product-modal');">В корзину</button>
                    <button class="btn-outline" onclick="closeModal('product-modal')">Закрыть</button>
                </div>
            </div>
        </div>
    `;
    
    const contentDiv = document.getElementById('product-modal-content');
    if (contentDiv) contentDiv.innerHTML = content;
    showModal('product-modal');
}

// ==================== НАВИГАЦИЯ ====================
function showPage(pageId) {
    closeMobileMenu();
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    const page = document.getElementById(`page-${pageId}`);
    if (page) page.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (pageId === 'catalog') renderCatalog();
    if (pageId === 'home') {
        renderFeaturedProducts();
        renderHistoryTimeline();
    }
    if (pageId === 'history') {
        renderFullHistory();
    }
}

function toggleMobileMenu() {
    const nav = document.getElementById('nav');
    const burger = document.getElementById('burger');
    if (nav) nav.classList.toggle('open');
    if (burger) burger.classList.toggle('open');
}

function closeMobileMenu() {
    const nav = document.getElementById('nav');
    const burger = document.getElementById('burger');
    if (nav) nav.classList.remove('open');
    if (burger) burger.classList.remove('open');
}

function toggleSearch() {
    const searchBar = document.getElementById('search-bar');
    if (searchBar) searchBar.classList.toggle('open');
}

function handleSearch(query) {
    const resultsDiv = document.getElementById('search-results');
    if (!query.trim()) {
        if (resultsDiv) resultsDiv.innerHTML = '';
        return;
    }
    
    const filtered = products.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.brandName && p.brandName.toLowerCase().includes(query.toLowerCase()))
    ).slice(0, 5);
    
    if (!resultsDiv) return;
    
    if (filtered.length === 0) {
        resultsDiv.innerHTML = '<div class="search-result-item">Ничего не найдено</div>';
        return;
    }
    
    resultsDiv.innerHTML = filtered.map(p => `
        <div class="search-result-item" onclick="showProductModal(${p.id})">
            <div class="search-result-emoji"><img src="${p.image}" width="30" height="30"></div>
            <div class="search-result-info">
                <div class="search-result-name">${p.name}</div>
                <div class="search-result-brand">${p.brandName || p.brand}</div>
            </div>
            <div class="search-result-price">${p.price} сом</div>
        </div>
    `).join('');
}

// ==================== ИСТОРИЯ ====================
function renderHistoryTimeline() {
    const container = document.getElementById('history-timeline');
    if (!container) return;
    
    container.innerHTML = `
        <div class="timeline-wrapper">
            <div class="timeline-item">
                <div class="timeline-year">1500 г. до н.э.</div>
                <div class="timeline-icon">🌱</div>
                <div class="timeline-content"><h3>Древние ольмеки</h3><p>Первыми начали использовать какао-бобы</p></div>
            </div>
            <div class="timeline-item">
                <div class="timeline-year">XVI век</div>
                <div class="timeline-icon">⛵</div>
                <div class="timeline-content"><h3>Испанское завоевание</h3><p>Шоколад попадает в Европу</p></div>
            </div>
            <div class="timeline-item">
                <div class="timeline-year">1828 год</div>
                <div class="timeline-icon">⚙️</div>
                <div class="timeline-content"><h3>Изобретение какао-масла</h3><p>Ван Хаутен создаёт пресс</p></div>
            </div>
            <div class="timeline-item">
                <div class="timeline-year">1875 год</div>
                <div class="timeline-icon">🥛</div>
                <div class="timeline-content"><h3>Молочный шоколад</h3><p>Даниэль Петер добавляет сухое молоко</p></div>
            </div>
        </div>
        <div class="history-funfacts">
            <h3>🍫 Интересные факты 🍫</h3>
            <div class="funfacts-grid">
                <div class="funfact-card">Шоколад улучшает настроение</div>
                <div class="funfact-card">Тёмный шоколад полезен для сердца</div>
                <div class="funfact-card">Какао-бобы использовались как валюта</div>
            </div>
        </div>
    `;
}

function renderFullHistory() {
    const container = document.getElementById('history-full-content');
    if (!container) return;
    container.innerHTML = `
      <div class="history-full-container">
        <h2>История шоколада</h2>
        <p style="color: var(--text-mid); line-height: 1.8; margin-top: 10px;">
          Шоколад — это не просто сладость. Это путешествие длиной в тысячелетия: от священного напитка майя
          до современных ремесленных плиток с редкими какао-бобами.
        </p>

        <div style="margin-top: 24px; display: grid; gap: 14px;">
          <div style="background: var(--ivory); border-radius: 16px; padding: 18px 18px; box-shadow: var(--shadow-sm);">
            <h3 style="margin-bottom: 8px;">🌿 Древняя Мезоамерика</h3>
            <p style="color: var(--text-mid); line-height: 1.75;">
              Ольмеки, майя и ацтеки первыми приручили какао. Какао-бобы ценились как валюта,
              а напиток из какао с пряностями считался ритуальным и “божественным”.
            </p>
          </div>
          <div style="background: var(--ivory); border-radius: 16px; padding: 18px 18px; box-shadow: var(--shadow-sm);">
            <h3 style="margin-bottom: 8px;">⛵ Европа и “шоколадная мода”</h3>
            <p style="color: var(--text-mid); line-height: 1.75;">
              В XVI веке какао попадает в Европу. Сахар и ваниль превращают горький напиток
              в любимый десерт аристократии. Шоколадные дома становятся трендом.
            </p>
          </div>
          <div style="background: var(--ivory); border-radius: 16px; padding: 18px 18px; box-shadow: var(--shadow-sm);">
            <h3 style="margin-bottom: 8px;">⚙️ Революция технологий</h3>
            <p style="color: var(--text-mid); line-height: 1.75;">
              В 1828 году пресс Ван Хаутена сделал шоколад массовым: появился какао-порошок и какао-масло.
              Затем — конширование, улучшившее текстуру и аромат.
            </p>
          </div>
          <div style="background: var(--ivory); border-radius: 16px; padding: 18px 18px; box-shadow: var(--shadow-sm);">
            <h3 style="margin-bottom: 8px;">🥛 Молочный шоколад и новые вкусы</h3>
            <p style="color: var(--text-mid); line-height: 1.75;">
              В 1875 году молочный шоколад меняет рынок: сладкий, мягкий, нежный.
              Сегодня шоколад — это целая гастрономия: орехи, ягоды, специи, карамель, мята и даже рубиновый шоколад.
            </p>
          </div>
        </div>

        <div style="margin-top: 26px; padding: 18px; border-radius: 18px; background: linear-gradient(135deg, var(--cream), var(--beige)); box-shadow: var(--shadow-sm);">
          <h3 style="margin-bottom: 10px;">🍫 Как выбирать шоколад</h3>
          <ul style="margin-left: 18px; line-height: 1.9; color: var(--text-mid);">
            <li>Смотрите на \(\\%\\) какао: чем выше — тем ярче вкус.</li>
            <li>Для подарка — выбирайте ассорти и необычные начинки.</li>
            <li>Темный шоколад лучше раскрывается с кофе и ягодами, молочный — с орехами и карамелью.</li>
          </ul>
        </div>
      </div>
    `;
}

// ==================== АДМИН (упрощённо) ====================
function doAdminLogin() {
    const user = document.getElementById('admin-login-username')?.value;
    const pass = document.getElementById('admin-login-pass')?.value;
    
    if (user === 'admin' && pass === 'admin123') {
        sessionStorage.setItem('admin_logged_in', '1');
        showToast('Вход выполнен!');
        const login = document.getElementById('auth-login');
        const profile = document.getElementById('auth-profile');
        if (login) login.classList.add('hidden');
        if (profile) profile.classList.remove('hidden');
        closeModal('auth-modal');
        window.location.href = 'admin/dashboard.html';
    } else {
        showToast('Неверный логин или пароль', 'error');
    }
}

function doAdminLogout() {
    sessionStorage.removeItem('admin_logged_in');
    const login = document.getElementById('auth-login');
    const profile = document.getElementById('auth-profile');
    if (login) login.classList.remove('hidden');
    if (profile) profile.classList.add('hidden');
    showToast('Выход выполнен');
    showPage('home');
}

function openAuthModal() {
    const login = document.getElementById('auth-login');
    const profile = document.getElementById('auth-profile');
    if (sessionStorage.getItem('admin_logged_in') === '1') {
        if (login) login.classList.add('hidden');
        if (profile) profile.classList.remove('hidden');
    } else {
        if (login) login.classList.remove('hidden');
        if (profile) profile.classList.add('hidden');
    }
    showModal('auth-modal');
}

function goToAdminDashboard() {
    if (sessionStorage.getItem('admin_logged_in') === '1') {
        window.location.href = 'admin/dashboard.html';
    } else {
        openAuthModal();
    }
}

async function sendContactMessage() {
    const name = document.getElementById('contact-name')?.value.trim();
    const email = document.getElementById('contact-email')?.value.trim();
    const message = document.getElementById('contact-message')?.value.trim();

    if (!name || !email || !message) {
        showToast('Заполните имя, email и сообщение', 'error');
        return;
    }

    try {
        if (window.saveMessage) {
            await window.saveMessage({ name, email, message });
            document.getElementById('contact-message').value = '';
            showToast('Сообщение отправлено! Мы ответим вам скоро');
            return;
        }
        showToast('База сообщений не настроена (Supabase)', 'error');
    } catch (error) {
        console.error(error);
        showToast(`Ошибка: ${error.message}`, 'error');
    }
}

// ==================== ЗАКАЗЫ ====================
async function placeOrder() {
    const name = document.getElementById('order-name')?.value;
    const phone = document.getElementById('order-phone')?.value;
    const address = document.getElementById('order-address')?.value;
    const payment = document.querySelector('input[name="payment"]:checked')?.value;
    
    if (!name || !phone || !address) {
        showToast('Заполните все поля!', 'error');
        return;
    }
    if (cart.length === 0) {
        showToast('Корзина пуста!', 'error');
        return;
    }
    
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const newOrder = {
        customer: name,
        phone: phone,
        address: address,
        payment: payment,
        items: cart.map(item => ({ id: item.id, name: item.name, quantity: item.quantity, price: item.price })),
        total: total
    };
    
    try {
        await saveOrder(newOrder);
        cart = [];
        updateCartCount();
        closeModal('checkout-modal');
        closeModal('cart-modal');
        showToast('Заказ оформлен! Спасибо');
    } catch (error) {
        console.error(error);
        showToast('Ошибка при оформлении заказа', 'error');
    }
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ====================
function filterByBrand(brandId) {
    showPage('catalog');
    setTimeout(() => {
        document.querySelectorAll('input[name="brand"]').forEach(cb => {
            cb.checked = cb.value === brandId;
        });
        applyFilters();
    }, 100);
}

function showCountryBrands(countryId) {
    filterByBrand(countryId);
}

function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.width = `${Math.random() * 6 + 3}px`;
        particle.style.height = particle.style.width;
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.animationDuration = `${Math.random() * 6 + 3}s`;
        container.appendChild(particle);
    }
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM загружен, инициализация...');
    await loadAllData();
    createParticles();
    
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('modal-overlay')) {
            closeAllModals();
        }

        const nav = document.getElementById('nav');
        const burger = document.getElementById('burger');
        if (nav?.classList.contains('open') && !nav.contains(e.target) && !burger?.contains(e.target)) {
            closeMobileMenu();
        }
    });
});