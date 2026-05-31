/**
 * main.js
 * Handles: responsive nav, theme toggle (SVG icons), scroll progress, active section tracking.
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
    desktopToggle.style.display = isMobile ? 'none' : 'flex';
  }
  syncMobileToggleVisibility();
  window.addEventListener('resize', syncMobileToggleVisibility);

  /* ── THEME TOGGLE ── */
  function applyTheme(theme) {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    // Update aria-labels to describe the action (switching TO the other theme)
    const label = theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme';
    desktopToggle.setAttribute('aria-label', label);
    mobileToggle.setAttribute('aria-label', label);
    localStorage.setItem('theme', theme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') === 'light'
      ? 'light' : 'dark';
    applyTheme(current === 'light' ? 'dark' : 'light');
  }

  const saved = localStorage.getItem('theme') || 'dark';
  applyTheme(saved);

  desktopToggle.addEventListener('click', toggleTheme);
  mobileToggle.addEventListener('click', toggleTheme);

  /* ── SCROLL PROGRESS BAR ── */
  const progressFill = document.getElementById('navProgress');

  function updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressFill.style.width = pct + '%';
    progressFill.classList.toggle('has-progress', pct > 1);
  }

  /* ── ACTIVE SECTION TRACKING ── */
  const sections   = ['about', 'education', 'projects', 'skills', 'contact'];
  const navAnchors = navLinks.querySelectorAll('a');

  function updateActiveLink() {
    const scrollMid = window.scrollY + window.innerHeight * 0.4;
    let active = '';

    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.offsetTop <= scrollMid) active = id;
    });

    navAnchors.forEach(a => {
      const href = a.getAttribute('href').replace('#', '');
      a.classList.toggle('nav-active', href === active);
    });
  }

  window.addEventListener('scroll', () => {
    updateProgress();
    updateActiveLink();
  }, { passive: true });

  updateProgress();
  updateActiveLink();
});
