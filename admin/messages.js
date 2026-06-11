async function loadMessages() {
  const result = document.getElementById('result');
  if (!result) return;

  result.innerHTML =
    '<div class="loading"><div class="spinner"></div><p>Загрузка сообщений...</p></div>';

  try {
    if (!window.fetchMessages) {
      throw new Error('Supabase клиент не загружен. Обновите страницу.');
    }

    const data = await window.fetchMessages();

    if (!data.length) {
      result.innerHTML = '<div class="admin-alert">📭 Пока нет сообщений от клиентов</div>';
      return;
    }

    const rows = data
      .map(
        (msg) => `
      <tr>
        <td data-label="Дата">${new Date(msg.created_at).toLocaleString('ru-RU')}</td>
        <td data-label="Имя"><strong>${adminEscapeHtml(msg.name)}</strong></td>
        <td data-label="Email"><a href="mailto:${adminEscapeHtml(msg.email)}">${adminEscapeHtml(msg.email)}</a></td>
        <td data-label="Сообщение" class="msg-cell">${adminEscapeHtml(msg.message)}</td>
        <td data-label="Действия">
          <button class="admin-btn admin-btn-delete" type="button" onclick="deleteMsg(${msg.id})">
            <i class="fas fa-trash"></i> Удалить
          </button>
        </td>
      </tr>`
      )
      .join('');

    result.innerHTML = `
      <div class="admin-table-container">
        <table class="admin-table admin-table-responsive">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Имя</th>
              <th>Email</th>
              <th>Сообщение</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  } catch (err) {
    console.error('Ошибка загрузки сообщений:', err);
    result.innerHTML = `<div class="admin-alert admin-alert-error">❌ Ошибка: ${adminEscapeHtml(err.message)}</div>`;
  }
}

async function deleteMsg(id) {
  if (!confirm('Удалить это сообщение?')) return;

  try {
    await window.deleteMessage(id);
    await loadMessages();
  } catch (err) {
    alert('Не удалось удалить: ' + err.message);
  }
}

window.deleteMsg = deleteMsg;

document.addEventListener('DOMContentLoaded', loadMessages);
