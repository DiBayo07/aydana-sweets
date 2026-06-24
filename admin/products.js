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
        (p) => {
          let img = p.image || '';
          if (img && !img.startsWith('http') && !img.startsWith('data:') && !img.startsWith('/')) {
            img = '../' + img;
          }
          return `
      <tr>
        <td><img src="${img}" width="45" height="45" style="border-radius:8px;object-fit:cover" alt=""></td>
        <td><strong>${escapeHtml(p.name)}</strong></td>
        <td>${escapeHtml(p.brandName || p.brand)}</td>
        <td>${TYPE_LABELS[p.type] || p.type}</td>
        <td>${p.cacao}%</td>
        <td>${p.price} сом</td>
        <td class="admin-actions">
          <button class="admin-btn admin-btn-edit" onclick="editProduct(${p.id})">✏️</button>
          <button class="admin-btn admin-btn-delete" onclick="deleteProduct(${p.id})">🗑️</button>
        </td>
      </tr>`;
        }
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
  
  // Reset preview and file input
  const preview = document.getElementById('productImagePreview');
  if (preview) {
    preview.src = '';
    preview.style.display = 'none';
  }
  const fileInput = document.getElementById('productImageFile');
  if (fileInput) fileInput.value = '';
  const statusEl = document.getElementById('uploadStatus');
  if (statusEl) statusEl.textContent = '';

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

  // Reset file input & setup preview
  const fileInput = document.getElementById('productImageFile');
  if (fileInput) fileInput.value = '';
  const statusEl = document.getElementById('uploadStatus');
  if (statusEl) statusEl.textContent = '';

  const preview = document.getElementById('productImagePreview');
  if (preview) {
    if (p.image) {
      preview.src = (p.image && !p.image.startsWith('http') && !p.image.startsWith('data:') && !p.image.startsWith('/')) 
        ? '../' + p.image 
        : p.image;
      preview.style.display = 'block';
    } else {
      preview.src = '';
      preview.style.display = 'none';
    }
  }

  document.getElementById('productModal').classList.add('active');
}

async function submitProductForm() {
  const name = document.getElementById('productName').value.trim();
  if (!name) {
    alert('Введите название');
    return;
  }

  const fileInput = document.getElementById('productImageFile');
  const statusEl = document.getElementById('uploadStatus');
  let imageUrl = document.getElementById('productImage').value.trim();

  // If a file is selected from device, upload it first
  if (fileInput && fileInput.files && fileInput.files[0]) {
    const file = fileInput.files[0];
    if (statusEl) statusEl.innerHTML = '⏳ Загрузка изображения с устройства...';
    try {
      imageUrl = await window.uploadProductImage(file);
      if (statusEl) statusEl.innerHTML = '✅ Загружено успешно!';
      document.getElementById('productImage').value = imageUrl;
    } catch (uploadErr) {
      console.error(uploadErr);
      if (statusEl) statusEl.innerHTML = `❌ Ошибка загрузки: ${uploadErr.message}`;
      alert(`Не удалось загрузить изображение: ${uploadErr.message}`);
      return; // Stop saving
    }
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
    image: imageUrl || 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=200',
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

// Event Listeners for Dynamic Previews
document.getElementById('productImageFile')?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const preview = document.getElementById('productImagePreview');
      if (preview) {
        preview.src = event.target.result;
        preview.style.display = 'block';
      }
    };
    reader.readAsDataURL(file);
  }
});

document.getElementById('productImage')?.addEventListener('input', (e) => {
  const url = e.target.value.trim();
  const preview = document.getElementById('productImagePreview');
  if (preview) {
    if (url) {
      preview.src = url;
      preview.style.display = 'block';
    } else {
      preview.style.display = 'none';
    }
  }
});

document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
  e.preventDefault();
  sessionStorage.removeItem('admin_logged_in');
  window.location.href = 'login.html';
});

window.onclick = (e) => {
  if (e.target.id === 'productModal') closeModal();
};

loadProducts();
