async function loadStats() {
  try {
    const [messagesResult, ordersResult] = await Promise.all([
      window.fetchMessages().catch(() => []),
      window.fetchOrders().catch(() => [])
    ]);

    document.getElementById('statMessages').textContent = messagesResult.length;
    document.getElementById('statOrders').textContent = ordersResult.length;
  } catch (err) {
    console.error('Ошибка загрузки статистики:', err);
    document.getElementById('statMessages').textContent = '0';
    document.getElementById('statOrders').textContent = '0';
  }
}

document.addEventListener('DOMContentLoaded', loadStats);
