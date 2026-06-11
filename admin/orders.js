const STATUS_LABELS = {
  new: '🆕 Новый',
  processing: '⚙️ В обработке',
  done: '✅ Доставлен',
  cancelled: '❌ Отменён'
};

async function loadOrders() {
  const tbody = document.getElementById('ordersBody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Загрузка...</td></tr>';

  try {
    if (!window.fetchOrders) {
      throw new Error('Supabase клиент не загружен. Обновите страницу.');
    }

    const orders = await window.fetchOrders();

    if (!orders.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Нет заказов</td></tr>';
      return;
    }

    tbody.innerHTML = orders
      .map((o) => {
        const customer = adminEscapeHtml(o.customer_name || o.customer || '—');
        const phone = adminEscapeHtml(o.phone || '—');
        const date = o.created_at ? new Date(o.created_at).toLocaleString('ru-RU') : '—';
        return `
      <tr>
        <td data-label="№"><strong>#${o.id}</strong></td>
        <td data-label="Покупатель">${customer}</td>
        <td data-label="Телефон">${phone}</td>
        <td data-label="Сумма">${o.total || 0} сом</td>
        <td data-label="Дата">${date}</td>
        <td data-label="Статус">
          <select class="order-status-select" onchange="updateStatus(${o.id}, this.value)">
            <option value="new" ${o.status === 'new' ? 'selected' : ''}>${STATUS_LABELS.new}</option>
            <option value="processing" ${o.status === 'processing' ? 'selected' : ''}>${STATUS_LABELS.processing}</option>
            <option value="done" ${o.status === 'done' ? 'selected' : ''}>${STATUS_LABELS.done}</option>
            <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>${STATUS_LABELS.cancelled}</option>
          </select>
        </td>
        <td data-label="Действия" class="admin-actions">
          <button class="admin-btn admin-btn-delete" type="button" onclick="deleteOrder(${o.id})">🗑️</button>
        </td>
      </tr>`;
      })
      .join('');
  } catch (err) {
    console.error('Ошибка загрузки заказов:', err);
    tbody.innerHTML =
      '<tr><td colspan="7" style="text-align:center;color:var(--admin-danger);font-weight:700;">❌ Ошибка загрузки заказов из Supabase</td></tr>';
  }
}

async function updateStatus(id, status) {
  try {
    await window.updateOrderStatus(id, status);
  } catch (err) {
    console.error(err);
    alert('Ошибка обновления статуса: ' + err.message);
    await loadOrders();
  }
}

async function deleteOrder(id) {
  if (!confirm('Удалить заказ?')) return;

  try {
    await window.deleteOrder(id);
    await loadOrders();
  } catch (err) {
    console.error(err);
    alert('Ошибка удаления: ' + err.message);
  }
}

window.updateStatus = updateStatus;
window.deleteOrder = deleteOrder;

document.addEventListener('DOMContentLoaded', loadOrders);
