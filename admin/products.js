if (sessionStorage.getItem('admin_logged_in') !== '1') {
  window.location.href = 'login.html';
}

let products = [];

const TYPE_LABELS = {
  dark: 'Тёмный',
  milk: 'Молочный',
  white: 'Белый',
  ruby: 'Рубиновый'
};

function showDbAlert(msg) {
  const el = document.getElementById('dbAlert');
  el.textContent = msg;
  el.classList.remove('hidden');
  el.classList.add('admin-alert-error');
}

async function loadProducts() {
  const tbody = document.getElementById('productsTableBody');
  try {
    products = await fetchProducts();
    if (!products.length) {
      tbody.innerHTML =
        '<tr><td colspan="7" style="text-align:center">Нет товаров. Нажмите «Добавить товар»</td></tr>';
      return;
    }
    tbody.innerHTML = products
      .map(
        (p) => `
      <tr>
        <td><img src="${p.image}" width="45" height="45" style="border-radius:8px;object-fit:cover" alt=""></td>
        <td><strong>${escapeHtml(p.name)}</strong></td>
        <td>${escapeHtml(p.brandName || p.brand)}</td>
        <td>${TYPE_LABELS[p.type] || p.type}</td>
        <td>${p.cacao}%</td>
        <td>${p.price} сом</td>
        <td class="admin-actions">
          <button class="admin-btn admin-btn-edit" onclick="editProduct(${p.id})">✏️</button>
          <button class="admin-btn admin-btn-delete" onclick="deleteProduct(${p.id})">🗑️</button>
        </td>
      </tr>`
      )
      .join('');
  } catch (err) {
    console.error(err);
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">Ошибка загрузки</td></tr>';
    showDbAlert(
      'Не удалось подключиться к Supabase. Выполните SQL из файла supabase/schema.sql в панели Supabase.'
    );
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showAddProductModal() {
  document.getElementById('modalTitle').textContent = 'Добавить товар';
  document.getElementById('productForm').reset();
  document.getElementById('editId').value = '';
  document.getElementById('productModal').classList.add('active');
}

function closeModal() {
  document.getElementById('productModal').classList.remove('active');
}

function editProduct(id) {
  const p = products.find((x) => x.id === id);
  if (!p) return;
  document.getElementById('modalTitle').textContent = 'Редактировать товар';
  document.getElementById('productName').value = p.name;
  document.getElementById('productBrand').value = p.brand;
  document.getElementById('productBrandName').value = p.brandName || '';
  document.getElementById('productType').value = p.type;
  document.getElementById('productCacao').value = p.cacao;
  document.getElementById('productPrice').value = p.price;
  document.getElementById('productFlavor').value = p.flavor || '';
  document.getElementById('productDesc').value = p.description || '';
  document.getElementById('productImage').value = p.image || '';
  document.getElementById('productHit').checked = (p.tags || []).includes('хит');
  document.getElementById('editId').value = p.id;
  document.getElementById('productModal').classList.add('active');
}

async function submitProductForm() {
  const name = document.getElementById('productName').value.trim();
  if (!name) {
    alert('Введите название');
    return;
  }
  const payload = {
    id: document.getElementById('editId').value
      ? parseInt(document.getElementById('editId').value, 10)
      : null,
    name,
    brand: document.getElementById('productBrand').value.trim() || 'other',
    brandName: document.getElementById('productBrandName').value.trim(),
    type: document.getElementById('productType').value,
    cacao: parseInt(document.getElementById('productCacao').value, 10) || 0,
    price: parseInt(document.getElementById('productPrice').value, 10) || 0,
    flavor: document.getElementById('productFlavor').value.trim() || 'classic',
    description: document.getElementById('productDesc').value.trim(),
    image:
      document.getElementById('productImage').value.trim() ||
      'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=200',
    tags: document.getElementById('productHit').checked ? ['хит'] : [],
    category: 'bar'
  };

  try {
    await window.saveProduct(payload);
    closeModal();
    await loadProducts();
    alert('Товар сохранён');
  } catch (err) {
    console.error(err);
    alert('Ошибка сохранения. Проверьте таблицу products в Supabase.');
  }
}

async function deleteProduct(id) {
  if (!confirm('Удалить этот товар?')) return;
  try {
    await removeProduct(id);
    await loadProducts();
  } catch (err) {
    console.error(err);
    alert('Ошибка удаления');
  }
}

document.getElementById('logoutBtn').addEventListener('click', (e) => {
  e.preventDefault();
  sessionStorage.removeItem('admin_logged_in');
  window.location.href = 'login.html';
});

window.onclick = (e) => {
  if (e.target.id === 'productModal') closeModal();
};

loadProducts();
