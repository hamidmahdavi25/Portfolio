/**
 * main.js
 * Handles: responsive nav, theme toggle (dark/light).
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ── NAV HAMBURGER ── */
  const navToggle = document.getElementById('navToggle');
  const navLinks  = document.getElementById('navLinks');

  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('open');
    navLinks.classList.toggle('open');
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });

  /* ── SHOW/HIDE MOBILE THEME TOGGLE ── */
  const mobileToggle  = document.getElementById('themeToggleMobile');
  const desktopToggle = document.getElementById('themeToggle');

  function syncMobileToggleVisibility() {
    const isMobile = window.innerWidth <= 900;
    mobileToggle.style.display  = isMobile ? 'flex' : 'none';
    // desktop toggle is always flex via CSS, hide it on mobile
    desktopToggle.style.display = isMobile ? 'none' : 'flex';
  }
  syncMobileToggleVisibility();
  window.addEventListener('resize', syncMobileToggleVisibility);

  /* ── THEME TOGGLE ── */
  const ICONS = { dark: '🌙', light: '☀️' };

  function applyTheme(theme) {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    desktopToggle.textContent = ICONS[theme];
    mobileToggle.textContent  = ICONS[theme];
    localStorage.setItem('theme', theme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') === 'light'
      ? 'light' : 'dark';
    applyTheme(current === 'light' ? 'dark' : 'light');
  }

  /* Apply saved or default (dark) theme on load */
  const saved = localStorage.getItem('theme') || 'dark';
  applyTheme(saved);

  desktopToggle.addEventListener('click', toggleTheme);
  mobileToggle.addEventListener('click', toggleTheme);
});
