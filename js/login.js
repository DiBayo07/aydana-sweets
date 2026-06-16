if (sessionStorage.getItem('admin_logged_in') === '1') {
  window.location.href = 'dashboard.html';
}

document.getElementById('loginForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const u = document.getElementById('username').value.trim();
  const p = document.getElementById('password').value;
  if (u === 'admin' && p === 'admin123') {
    sessionStorage.setItem('admin_logged_in', '1');
    window.location.href = 'dashboard.html';
  } else {
    alert('Неверный логин или пароль');
  }
});
