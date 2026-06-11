if (sessionStorage.getItem('admin_logged_in') !== '1') {
  window.location.href = 'login.html';
}

function initAdminMobileMenu() {
  const toggle = document.getElementById('adminMenuToggle');
  const sidebar = document.querySelector('.admin-sidebar');
  const overlay = document.getElementById('adminSidebarOverlay');

  function closeAdminMenu() {
    sidebar?.classList.remove('open');
    overlay?.classList.remove('open');
    toggle?.classList.remove('open');
    document.body.classList.remove('admin-menu-open');
  }

  function openAdminMenu() {
    sidebar?.classList.add('open');
    overlay?.classList.add('open');
    toggle?.classList.add('open');
    document.body.classList.add('admin-menu-open');
  }

  toggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (sidebar?.classList.contains('open')) {
      closeAdminMenu();
    } else {
      openAdminMenu();
    }
  });

  overlay?.addEventListener('click', closeAdminMenu);

  document.addEventListener('click', (e) => {
    if (window.innerWidth > 768) return;
    if (!sidebar?.classList.contains('open')) return;
    if (sidebar.contains(e.target) || toggle?.contains(e.target)) return;
    closeAdminMenu();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) closeAdminMenu();
  });

  sidebar?.querySelectorAll('.admin-menu-item').forEach((link) => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) closeAdminMenu();
    });
  });
}

function initAdminLogout() {
  document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    sessionStorage.removeItem('admin_logged_in');
    window.location.href = 'login.html';
  });
}

function adminEscapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

document.addEventListener('DOMContentLoaded', () => {
  initAdminMobileMenu();
  initAdminLogout();
});
