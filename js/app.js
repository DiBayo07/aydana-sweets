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


function renderFeaturedProducts() {
    const container = document.getElementById('featured-products');
    if (!container) return;
    
    const featured = products.filter(p => p.tags && p.tags.includes('хит')).slice(0, 4);
    console.log('Хиты продаж:', featured.length);
    
    if (featured.length === 0) {
      
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

function renderBrandFilters() {
    const container = document.getElementById('brand-filter-list');
    if (!container) return;
    
    // Ручной список брендов
    const manualBrands = [
        { id: 'milka', name: 'Milka' },
        { id: 'alpen_gold', name: 'Alpen Gold' },
        { id: 'roshen', name: 'Roshen' },
        { id: 'ritter_sport', name: 'Ritter Sport' },
        { id: 'alenka', name: 'Аленка' },
        { id: 'yahya', name: 'Yahya' },
        { id: 'toblerone', name: 'Toblerone' },
        { id: 'nestle', name: 'Nestle' },
        { id: 'oreo', name: 'Oreo' },
        { id: 'babaevsky', name: 'Бабаевский' },
        { id: 'rotfront', name: 'РотФронт' }
    ];
    
    container.innerHTML = manualBrands.map(b => `
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

function showPage(pageId) {
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
    if (nav) nav.classList.toggle('open');
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


function renderHistoryTimeline() {
    const container = document.getElementById('history-timeline');
    if (!container) return;

    container.innerHTML = `
        <div class="timeline-wrapper">
            <div class="timeline-item">
                <div class="timeline-year">1500 г. до н.э.</div>
                <div class="timeline-icon"></div>
                <div class="timeline-content">
                    <h3>Древние ольмеки</h3>
                    <p>Первыми начали использовать какао-бобы</p>
                </div>
                <div class="timeline-image">
                    <img src="hbhbh.png" alt="Ольмеки какао" loading="lazy">
                </div>
            </div>
            <div class="timeline-item">
                <div class="timeline-year">XVI век</div>
                <div class="timeline-icon"></div>
                <div class="timeline-content">
                    <h3>Испанское завоевание</h3>
                    <p>Шоколад попадает в Европу</p>
                </div>
                <div class="timeline-image">
                    <img src="dfcdf.png" alt="Испанцы шоколад" loading="lazy">
                </div>
            </div>
            <div class="timeline-item">
                <div class="timeline-year">1828 год</div>
                <div class="timeline-icon"></div>
                <div class="timeline-content">
                    <h3>Изобретение какао-масла</h3>
                    <p>Ван Хаутен создаёт пресс</p>
                </div>
                <div class="timeline-image">
                    <img src="bhhbh.png" alt="Какао пресс" loading="lazy">
                </div>
            </div>
            <div class="timeline-item">
                <div class="timeline-year">1875 год</div>
                <div class="timeline-icon"></div>
                <div class="timeline-content">
                    <h3>Молочный шоколад</h3>
                    <p>Даниэль Петер добавляет сухое молоко</p>
                </div>
                <div class="timeline-image">
                    <img src="wsdxs.png" alt="Молочный шоколад" loading="lazy">
                </div>
            </div>
        </div>
        <div class="history-funfacts">
            <h3> Интересные факты </h3>
            <div class="funfacts-grid">
                <div class="funfact-card">
                    <span class="funfact-emoji"></span>
                    Шоколад улучшает настроение
                </div>
                <div class="funfact-card">
                    <span class="funfact-emoji"></span>
                    Тёмный шоколад полезен для сердца
                </div>
                <div class="funfact-card">
                    <span class="funfact-emoji"></span>
                    Какао-бобы использовались как валюта
                </div>
            </div>
        </div>
    `;
}

function renderFullHistory() {
    const container = document.getElementById('history-full-content');
    if (!container) return;
    container.innerHTML = `
      <div class="history-full-container">
        <div class="history-hero">
          <div class="history-hero-content">
            <h1> История шоколада</h1>
            <p>Путешествие длиной в 4000 лет: от священного напитка древних цивилизаций до изысканного десерта наших дней</p>
          </div>
        </div>

        <div class="history-era-item">
          <div class="history-era-info">
            <div class="history-era-year"> 1500 г. до н.э. — 400 г. н.э.</div>
            <h3> Древняя Мезоамерика</h3>
            <p>Ольмеки, майя и ацтеки первыми «приручили» какао-деревья. Какао-бобы использовались как <strong>валюта</strong> — за 100 бобов можно было купить раба! Напиток «чоколатль» готовили из молотых какао-бобов, воды, перца чили и ванили. Его пили <strong>холодным и горьким</strong>, считая божественным эликсиром.</p>
            <div class="history-fact"> Интересный факт: Монтесума, правитель ацтеков, выпивал до 50 чашек чоколатля в день для повышения выносливости и настроения.</div>
          </div>
          <div class="history-era-image">
            <img src="uuuih.png" alt="Древние цивилизации какао" onerror="this.src='https://cdn.pixabay.com/photo/2020/06/26/23/41/cocoa-5345420_640.jpg'">
          </div>
        </div>

        <div class="history-era-item reverse">
          <div class="history-era-info">
            <div class="history-era-year">1528 год</div>
            <h3>Испанское завоевание</h3>
            <p>Кортес привёз какао-бобы в Испанию. Монахи добавили <strong>сахар, мёд и ваниль</strong> — напиток стал сладким и горячим! Более 100 лет рецепт держался в <strong>секрете</strong> при испанском дворе. Шоколад считался афродизиаком и лекарством от всех болезней.</p>
            <div class="history-fact"> Интересный факт: Папа Римский Пий V пробовал шоколад и объявил, что он не нарушает пост — его можно пить даже в Великий пост!</div>
          </div>
          <div class="history-era-image">
            <img src="mjknjh.png" alt="Испанский шоколад" onerror="this.src='https://cdn.pixabay.com/photo/2017/01/15/22/57/hot-chocolate-1982776_640.jpg'">
          </div>
        </div>

        <div class="history-era-item">
          <div class="history-era-info">
            <div class="history-era-year"> 1828 год</div>
            <h3>Технологическая революция</h3>
            <p>Голландский химик <strong>Конрад ван Хаутен</strong> изобрёл гидравлический пресс, который отделял какао-масло от какао-бобов. Так появился <strong>какао-порошок</strong> и твёрдый шоколад! А в 1879 году <strong>Рудольф Линдт</strong> (основатель Lindt) изобрёл конширование — процесс непрерывного перемешивания, который сделал шоколад невероятно нежным и тающим во рту.</p>
            <div class="history-fact"> Интересный факт: Первая шоколадная плитка была выпущена в Англии в 1847 году компанией Fry & Sons.</div>
          </div>
          <div class="history-era-image">
            <img src="resdx.png" alt="Производство шоколада" onerror="this.src='https://cdn.pixabay.com/photo/2016/11/15/15/32/cocoa-1826644_640.jpg'">
          </div>
        </div>

        <div class="history-era-item reverse">
          <div class="history-era-info">
            <div class="history-era-year"> 1875 год — наши дни</div>
            <h3>Молочный шоколад и современность</h3>
            <p>Швейцарец <strong>Даниэль Петер</strong> (зять создателя Nestlé) добавил в тёмный шоколад сгущённое молоко — родился <strong>молочный шоколад</strong>! Сегодня существует <strong>более 1000 видов шоколада</strong>: белый, рубиновый, с морской солью, перцем, мятой, лавандой, беконом и даже с сыром!</p>
            <div class="history-fact"> Интересный факт: Рубиновый шоколад розового цвета был изобретён в 2017 году компанией Barry Callebaut — это первый новый цвет шоколада за 80 лет!</div>
          </div>
          <div class="history-era-image">
            <img src="tftrfgd.png" alt="Современный шоколад" onerror="this.src='https://cdn.pixabay.com/photo/2019/10/12/11/55/chocolate-4544343_640.jpg'">
          </div>
        </div>

        <div class="history-stats-grid">
          <div class="history-stat-card">
            <div class="stat-number">40 млн</div>
            <div class="stat-desc">человек ежедневно едят шоколад</div>
          </div>
          <div class="history-stat-card">
            <div class="stat-number">$100 млрд</div>
            <div class="stat-desc">мировой рынок шоколада в год</div>
          </div>
          <div class="history-stat-card">
            <div class="stat-number">30 000</div>
            <div class="stat-desc">сортов какао-бобов в мире</div>
          </div>
          <div class="history-stat-card">
            <div class="stat-number">4000 лет</div>
            <div class="stat-desc">истории шоколада</div>
          </div>
        </div>

        <div class="history-funfacts">
          <h3> Удивительные факты о шоколаде</h3>
          <div class="funfacts-grid">
            <div class="funfact-card">
              <div class="funfact-emoji"></div>
              <p>Шоколад содержит фенилэтиламин — "вещество любви", которое вырабатывается в мозге, когда мы влюблены</p>
            </div>
            <div class="funfact-card">
              <div class="funfact-emoji"></div>
              <p>Тёмный шоколад снижает давление и улучшает работу сердца благодаря флавоноидам</p>
            </div>
            <div class="funfact-card">
              <div class="funfact-emoji"></div>
              <p>У ацтеков 100 какао-бобов стоили 1 раба — шоколад был дороже золота!</p>
            </div>
            <div class="funfact-card">
              <div class="funfact-emoji"></div>
              <p>Швейцария — страна, потребляющая больше всего шоколада на душу населения: 9 кг в год</p>
            </div>
            <div class="funfact-card">
              <div class="funfact-emoji"></div>
              <p>Самая большая шоколадная плитка весила 5,8 тонн — как средний слон!</p>
            </div>
            
          </div>
        </div>

        
    `;
}


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


document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM загружен, инициализация...');
    await loadAllData();
    createParticles();
    
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('modal-overlay')) {
            closeAllModals();
        }
    });
});




function toggleMobileMenu() {
    const nav = document.getElementById('nav');
    const burger = document.getElementById('burger');
    
    if (nav) {
        nav.classList.toggle('open');
        burger?.classList.toggle('active');
        
     
        if (nav.classList.contains('open')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }
}

function closeMobileMenu() {
    const nav = document.getElementById('nav');
    const burger = document.getElementById('burger');
    
    if (nav && nav.classList.contains('open')) {
        nav.classList.remove('open');
        burger?.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function initMobileMenu() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            closeMobileMenu();
        });
    });
    
   
    document.addEventListener('click', (e) => {
        const nav = document.getElementById('nav');
        const burger = document.getElementById('burger');
        
        if (!nav || !burger) return;
    
        if (nav.classList.contains('open') && 
            !burger.contains(e.target) && 
            !nav.contains(e.target)) {
            closeMobileMenu();
        }
    });
    

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeMobileMenu();
        }
    });
    

    window.addEventListener('scroll', () => {
        closeMobileMenu();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
});