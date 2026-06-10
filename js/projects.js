/**
 * projects.js
 * Renders project cards from two data files:
 *   data/projects.json      → main grid with images (#pgrid)
 *   data/more-projects.json → compact text list (#mprojGrid)
 *
 * Clicking any card cover opens the full-screen lightbox (lightbox.js).
 */

const NAV_PREV_SVG = `<svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>`;
const NAV_NEXT_SVG = `<svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>`;
const ZOOM_IN_SVG  = `<svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM10 10H8v-1h2V7h1v2h2v1h-2v2h-1v-2z"/></svg>`;
const ZOOM_OUT_SVG = `<svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM7 9h5v1H7z"/></svg>`;

const COVER_DRAG_THRESHOLD = 40;
const ZOOM_LEVELS = [1, 2, 3.5];

let currentFilter = 'all';

function buildDescHtml(p) {
  if (!p.scope) return `<p class="pdesc">${p.description}</p>`;
  const rows = [
    ['Scope',        p.scope],
    ['Key figures',  p.keyFigures],
    ['Deliverables', p.deliverables],
    ['My role',      p.myRole],
    ['Challenge',    p.challenge],
  ].filter(([, v]) => v);
  const rowsHtml = rows.map(([label, val]) =>
    `<div class="pdesc-row"><dt>${label}</dt><dd>${val}</dd></div>`
  ).join('');
  return `<p class="pdesc-intro">${p.description}</p><dl class="pdesc-list">${rowsHtml}</dl>`;
}

function buildImagePaths(id, count) {
  return Array.from({ length: count }, (_, i) => `./images/projects/${id}i${i + 1}.jpg`);
}

function getCoverIndex(card) {
  return parseInt(card.dataset.coverIndex || '0', 10);
}

function setCoverIndex(card, images, index) {
  const idx = ((index % images.length) + images.length) % images.length;
  card.dataset.coverIndex = String(idx);
  resetCoverZoom(card);
  applyResponsiveSrc(card.querySelector('.pcover > img'), images[idx], 'cover');
  card.querySelectorAll('.pdot').forEach((d, i) => d.classList.toggle('active', i === idx));
  const navEls = card.querySelectorAll('.pcover-nav');
  navEls.forEach(n => n.style.display = images.length > 1 ? 'flex' : 'none');
}

function navCover(card, delta) {
  const images = card.dataset.images.split(',');
  setCoverIndex(card, images, getCoverIndex(card) + delta);
}

function applyCoverZoom(cover, zoom, panX, panY) {
  const img = cover.querySelector('img');
  img.style.transform = zoom > 1
    ? `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px)`
    : '';
  img.style.transition = zoom > 1 ? 'none' : 'transform .4s ease';
  cover.classList.toggle('zoomed', zoom > 1);
  cover.style.cursor = zoom > 1 ? 'grab' : 'pointer';
}

function resetCoverZoom(card) {
  const cover = card.querySelector('.pcover');
  card.dataset.zoom = '0';
  card.dataset.panX = '0';
  card.dataset.panY = '0';
  applyCoverZoom(cover, 1, 0, 0);
  const zoomBtn = card.querySelector('.pcover-zoom');
  if (zoomBtn) { zoomBtn.innerHTML = ZOOM_IN_SVG; zoomBtn.setAttribute('aria-label', 'Zoom in'); }
}

function cycleCoverZoom(card) {
  const cover = card.querySelector('.pcover');
  let zoomIdx = parseInt(card.dataset.zoom || '0', 10);
  zoomIdx = (zoomIdx + 1) % ZOOM_LEVELS.length;
  card.dataset.zoom = String(zoomIdx);
  card.dataset.panX = '0';
  card.dataset.panY = '0';
  const zoom = ZOOM_LEVELS[zoomIdx];
  applyCoverZoom(cover, zoom, 0, 0);
  const zoomBtn = card.querySelector('.pcover-zoom');
  if (zoomBtn) {
    const isZoomed = zoom > 1;
    zoomBtn.innerHTML = isZoomed ? ZOOM_OUT_SVG : ZOOM_IN_SVG;
    zoomBtn.setAttribute('aria-label', isZoomed ? 'Zoom out' : 'Zoom in');
  }
}

function clampPan(zoom, panX, panY, cover) {
  const w = cover.offsetWidth;
  const h = cover.offsetHeight;
  const maxX = (w * (zoom - 1)) / 2;
  const maxY = (h * (zoom - 1)) / 2;
  return [
    Math.max(-maxX, Math.min(maxX, panX)),
    Math.max(-maxY, Math.min(maxY, panY)),
  ];
}

function initCoverInteraction(cover, images, card) {
  let dragging = false;
  let moved = false;
  let startX = 0;
  let startY = 0;
  let panStartX = 0;
  let panStartY = 0;

  cover.addEventListener('touchstart', () => {
    cover.classList.add('touch-active');
    clearTimeout(cover._touchTimer);
    cover._touchTimer = setTimeout(() => cover.classList.remove('touch-active'), 2000);
  }, { passive: true });

  cover.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('button')) return;
    dragging = true;
    moved = false;
    startX = e.clientX;
    startY = e.clientY;
    panStartX = parseFloat(card.dataset.panX || '0');
    panStartY = parseFloat(card.dataset.panY || '0');
    cover.setPointerCapture(e.pointerId);
    cover.classList.add('dragging');
  });

  cover.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
    const zoom = ZOOM_LEVELS[parseInt(card.dataset.zoom || '0', 10)];
    if (zoom > 1) {
      const [cx, cy] = clampPan(zoom, panStartX + dx, panStartY + dy, cover);
      card.dataset.panX = String(cx);
      card.dataset.panY = String(cy);
      applyCoverZoom(cover, zoom, cx, cy);
    } else if (images.length > 1) {
      cover.querySelector('img').style.transform = `translateX(${dx * 0.25}px)`;
    }
  });

  const endDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    cover.classList.remove('dragging');
    cover.releasePointerCapture(e.pointerId);
    const dx = e.clientX - startX;
    const zoom = ZOOM_LEVELS[parseInt(card.dataset.zoom || '0', 10)];

    if (zoom <= 1 && images.length > 1 && moved && Math.abs(dx) >= COVER_DRAG_THRESHOLD) {
      cover.querySelector('img').style.transform = '';
      setCoverIndex(card, images, getCoverIndex(card) + (dx < 0 ? 1 : -1));
      return;
    }
    if (zoom <= 1 && images.length > 1) {
      cover.querySelector('img').style.transform = '';
    }

    // Clean click (no significant movement, not zoomed) → open lightbox
    if (!moved && zoom <= 1) {
      openLightbox(images, card.dataset.title, 0);
    }
  };

  cover.addEventListener('pointerup', endDrag);
  cover.addEventListener('pointercancel', endDrag);
}

function renderCard(project) {
  const images = buildImagePaths(project.id, project.images);

  const card = document.createElement('div');
  card.className = 'pcard';
  card.dataset.tag         = project.category;
  card.dataset.images      = images.join(',');
  card.dataset.title       = project.title;
  card.dataset.coverIndex  = '0';
  card.dataset.zoom        = '0';
  card.dataset.panX        = '0';
  card.dataset.panY        = '0';

  const coverImg = document.createElement('img');
  coverImg.alt       = project.title;
  coverImg.draggable = false;
  coverImg.loading   = 'lazy';
  coverImg.decoding  = 'async';
  coverImg.width     = 800;          /* container aspect-ratio handles layout; */
  coverImg.height    = 500;          /* attrs are a CLS hint (16:10)            */
  applyResponsiveSrc(coverImg, images[0], 'cover');

  const overlay = document.createElement('div');
  overlay.className = 'pcover-overlay';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'pcover-nav pcover-prev';
  prevBtn.innerHTML = NAV_PREV_SVG;
  prevBtn.setAttribute('aria-label', 'Previous image');
  if (images.length <= 1) prevBtn.style.display = 'none';
  prevBtn.addEventListener('click', (e) => { e.stopPropagation(); navCover(card, -1); });

  const nextBtn = document.createElement('button');
  nextBtn.className = 'pcover-nav pcover-next';
  nextBtn.innerHTML = NAV_NEXT_SVG;
  nextBtn.setAttribute('aria-label', 'Next image');
  if (images.length <= 1) nextBtn.style.display = 'none';
  nextBtn.addEventListener('click', (e) => { e.stopPropagation(); navCover(card, 1); });

  const zoomBtn = document.createElement('button');
  zoomBtn.className = 'pcover-zoom';
  zoomBtn.innerHTML = ZOOM_IN_SVG;
  zoomBtn.setAttribute('aria-label', 'Zoom in');
  zoomBtn.addEventListener('click', (e) => { e.stopPropagation(); cycleCoverZoom(card); });

  const cover = document.createElement('div');
  cover.className = 'pcover';
  if (images.length > 1) cover.classList.add('has-album');
  cover.style.cursor = 'pointer';
  cover.append(coverImg, overlay, prevBtn, nextBtn, zoomBtn);
  initCoverInteraction(cover, images, card);

  const dots = document.createElement('div');
  dots.className = 'pdots';
  images.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'pdot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Image ${i + 1}`);
    dot.addEventListener('click', () => setCoverIndex(card, images, i));
    dots.appendChild(dot);
  });

  const tagsEl = document.createElement('div');
  tagsEl.className = 'ptags';
  project.tags.forEach(tag => {
    const span = document.createElement('span');
    span.className = 'ptag';
    span.textContent = tag;
    tagsEl.appendChild(span);
  });

  const body = document.createElement('div');
  body.className = 'pcard-body';
  body.innerHTML = `
    <div class="pcard-header">
      <span class="ptype">${project.category}</span>
      <span class="pyear">${project.year} · ${project.location}</span>
    </div>
    <h3>${project.title}</h3>
    <p class="pplant">${project.client}</p>
    ${buildDescHtml(project)}
  `;
  body.appendChild(tagsEl);

  card.append(cover, dots, body);
  return card;
}

function renderCompactItem(project) {
  const item = document.createElement('div');
  item.className = 'mproj-item';
  item.dataset.tag = project.category;

  const tagsHtml = project.tags.map(t => `<span class="mproj-tag">${t}</span>`).join('');

  item.innerHTML = `
    <div class="mproj-item-top">
      <span class="mproj-title">${project.title}</span>
      <span class="mproj-year">${project.year}</span>
    </div>
    <span class="mproj-cat">${project.category}</span>
    <span class="mproj-client">${project.client}</span>
    <div class="mproj-tags">${tagsHtml}</div>
  `;
  return item;
}

function applyFilter(filter) {
  currentFilter = filter;
  document.querySelectorAll('.pcard, .mproj-item').forEach(c => {
    c.style.display = (filter === 'all' || c.dataset.tag === filter) ? 'flex' : 'none';
  });
}

async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function initProjects() {
  const grid      = document.getElementById('pgrid');
  const mprojGrid = document.getElementById('mprojGrid');

  try {
    const [mainProjects, moreProjects] = await Promise.all([
      fetchJSON('./data/projects.json'),
      fetchJSON('./data/more-projects.json'),
    ]);

    mainProjects.forEach(p => grid.appendChild(renderCard(p)));

    if (mprojGrid && moreProjects.length > 0) {
      moreProjects.forEach(p => mprojGrid.appendChild(renderCompactItem(p)));
    }
  } catch (e) {
    console.error('Could not load project data:', e);
  }

  document.querySelectorAll('.fbtn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.fbtn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilter(btn.dataset.filter);
    });
  });
}

document.addEventListener('DOMContentLoaded', initProjects);
