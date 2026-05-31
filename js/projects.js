/**
 * projects.js
 * Renders all project cards from ./data/projects.json
 *
 * HOW TO ADD A PROJECT:
 *   1. Open data/projects.json
 *   2. Add a new object following the schema (see existing entries)
 *   3. Set "featured": true  →  card is visible by default (first 4 — two rows)
 *      Set "featured": false →  card is hidden until "Show more" is clicked
 *   4. Add images to images/projects/
 *      Name them:  {id}i1.jpg, {id}i2.jpg ... up to {id}i{images}.jpg
 *      Example for id "p19" with 3 images: p19i1.jpg, p19i2.jpg, p19i3.jpg
 *
 * HOW IMAGES ARE CONNECTED:
 *   Each project has an "id" (e.g. "p1") and "images" count (e.g. 3).
 *   This module generates paths: images/projects/p1i1.jpg ... p1i3.jpg
 *   Place your files at that path inside the repo.
 */

const NAV_PREV_SVG = `<svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>`;
const NAV_NEXT_SVG = `<svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>`;
const ZOOM_IN_SVG  = `<svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM10 10H8v-1h2V7h1v2h2v1h-2v2h-1v-2z"/></svg>`;
const ZOOM_OUT_SVG = `<svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM7 9h5v1H7z"/></svg>`;
const COVER_DRAG_THRESHOLD = 40;
const ZOOM_LEVELS = [1, 2, 3.5];  // click cycles through these

let showAllState = false;
let currentFilter = 'all';

/** Build image path array for a project */
function buildImagePaths(id, count) {
  return Array.from({ length: count }, (_, i) => `./images/projects/${id}i${i + 1}.jpg`);
}

/** Get / set the active cover index on a card */
function getCoverIndex(card) {
  return parseInt(card.dataset.coverIndex || '0', 10);
}

function setCoverIndex(card, images, index) {
  const idx = ((index % images.length) + images.length) % images.length;
  card.dataset.coverIndex = String(idx);
  // Reset zoom when switching images
  resetCoverZoom(card);
  card.querySelector('.pcover > img').src = images[idx];
  card.querySelectorAll('.pdot').forEach((d, i) => d.classList.toggle('active', i === idx));
  const navEls = card.querySelectorAll('.pcover-nav');
  navEls.forEach(n => n.style.display = images.length > 1 ? 'flex' : 'none');
}

/** Navigate card cover by delta */
function navCover(card, delta) {
  const images = card.dataset.images.split(',');
  setCoverIndex(card, images, getCoverIndex(card) + delta);
}

/** Apply zoom transform to cover image */
function applyCoverZoom(cover, zoom, panX, panY) {
  const img = cover.querySelector('img');
  img.style.transform = zoom > 1
    ? `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px)`
    : '';
  img.style.transition = zoom > 1 ? 'none' : 'transform .4s ease';
  cover.classList.toggle('zoomed', zoom > 1);
  cover.style.cursor = zoom > 1 ? 'grab' : (cover.classList.contains('has-album') ? 'grab' : 'zoom-in');
}

/** Reset zoom on a card back to 1× */
function resetCoverZoom(card) {
  const cover = card.querySelector('.pcover');
  card.dataset.zoom      = '0';  // index into ZOOM_LEVELS
  card.dataset.panX      = '0';
  card.dataset.panY      = '0';
  applyCoverZoom(cover, 1, 0, 0);
  const zoomBtn = card.querySelector('.pcover-zoom');
  if (zoomBtn) { zoomBtn.innerHTML = ZOOM_IN_SVG; zoomBtn.setAttribute('aria-label', 'Zoom in'); }
}

/** Cycle zoom on click (no drag occurred) */
function cycleCoverZoom(card) {
  const cover    = card.querySelector('.pcover');
  let zoomIdx    = parseInt(card.dataset.zoom || '0', 10);
  zoomIdx        = (zoomIdx + 1) % ZOOM_LEVELS.length;
  card.dataset.zoom = String(zoomIdx);
  card.dataset.panX = '0';
  card.dataset.panY = '0';
  const zoom = ZOOM_LEVELS[zoomIdx];
  applyCoverZoom(cover, zoom, 0, 0);
  // Update zoom icon
  const zoomBtn = card.querySelector('.pcover-zoom');
  if (zoomBtn) {
    const isZoomed = zoom > 1;
    zoomBtn.innerHTML = isZoomed ? ZOOM_OUT_SVG : ZOOM_IN_SVG;
    zoomBtn.setAttribute('aria-label', isZoomed ? 'Zoom out' : 'Zoom in');
  }
}

/** Clamp pan so image doesn't drift too far off-screen */
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

/** Wire zoom, pan, and drag-to-switch onto the cover */
function initCoverInteraction(cover, images, card) {
  let dragging  = false;
  let moved     = false;
  let startX    = 0;
  let startY    = 0;
  let panStartX = 0;
  let panStartY = 0;

  // Touch: briefly show controls
  cover.addEventListener('touchstart', () => {
    cover.classList.add('touch-active');
    clearTimeout(cover._touchTimer);
    cover._touchTimer = setTimeout(() => cover.classList.remove('touch-active'), 2000);
  }, { passive: true });

  cover.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('button')) return;  // let nav/zoom buttons handle their own clicks
    dragging  = true;
    moved     = false;
    startX    = e.clientX;
    startY    = e.clientY;
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
      // Pan the zoomed image
      const [cx, cy] = clampPan(zoom, panStartX + dx, panStartY + dy, cover);
      card.dataset.panX = String(cx);
      card.dataset.panY = String(cy);
      applyCoverZoom(cover, zoom, cx, cy);
    } else if (images.length > 1) {
      // Drag to browse images
      cover.querySelector('img').style.transform = `translateX(${dx * 0.25}px)`;
    }
  });

  const endDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    cover.classList.remove('dragging');
    cover.releasePointerCapture(e.pointerId);

    const dx   = e.clientX - startX;
    const zoom = ZOOM_LEVELS[parseInt(card.dataset.zoom || '0', 10)];

    if (zoom <= 1 && images.length > 1 && moved && Math.abs(dx) >= COVER_DRAG_THRESHOLD) {
      // Drag switched image
      cover.querySelector('img').style.transform = '';
      setCoverIndex(card, images, getCoverIndex(card) + (dx < 0 ? 1 : -1));
      return;
    }

    if (zoom <= 1 && images.length > 1) {
      cover.querySelector('img').style.transform = '';
    }

    if (!moved) {
      // Plain click on image — no action (zoom is via zoom button only)
    }
  };

  cover.addEventListener('pointerup', endDrag);
  cover.addEventListener('pointercancel', endDrag);
}

/** Render a single project card DOM element */
function renderCard(project, index) {
  const images  = buildImagePaths(project.id, project.images);
  const isExtra = index >= 4;

  const card = document.createElement('div');
  card.className = 'pcard' + (isExtra ? ' extra' : '');
  card.dataset.tag        = project.category;
  card.dataset.images     = images.join(',');
  card.dataset.title      = project.title;
  card.dataset.coverIndex = '0';
  card.dataset.zoom       = '0';
  card.dataset.panX       = '0';
  card.dataset.panY       = '0';

  /* Cover image */
  const coverImg = document.createElement('img');
  coverImg.src = images[0];
  coverImg.alt = project.title;
  coverImg.draggable = false;
  coverImg.onerror = () => {
    coverImg.onerror = null;
    const label = project.title.replace(/\s+/g, '+');
    coverImg.src = `https://placehold.co/800x500/1a1c1f/b89b6a?text=${label}`;
  };

  const overlay = document.createElement('div');
  overlay.className = 'pcover-overlay';

  /* Prev / Next arrows */
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

  /* Zoom button — cycles in-card zoom */
  const zoomBtn = document.createElement('button');
  zoomBtn.className = 'pcover-zoom';
  zoomBtn.innerHTML = ZOOM_IN_SVG;
  zoomBtn.setAttribute('aria-label', 'Zoom in');
  zoomBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    cycleCoverZoom(card);
  });

  const cover = document.createElement('div');
  cover.className = 'pcover';
  if (images.length > 1) cover.classList.add('has-album');
  cover.append(coverImg, overlay, prevBtn, nextBtn, zoomBtn);
  initCoverInteraction(cover, images, card);

  /* Dot indicators */
  const dots = document.createElement('div');
  dots.className = 'pdots';
  images.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'pdot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Image ${i + 1}`);
    dot.addEventListener('click', () => setCoverIndex(card, images, i));
    dots.appendChild(dot);
  });

  /* Tags */
  const tagsEl = document.createElement('div');
  tagsEl.className = 'ptags';
  project.tags.forEach(tag => {
    const span = document.createElement('span');
    span.className = 'ptag';
    span.textContent = tag;
    tagsEl.appendChild(span);
  });

  /* Card body */
  const body = document.createElement('div');
  body.className = 'pcard-body';
  body.innerHTML = `
    <div class="pcard-header">
      <span class="ptype">${project.category}</span>
      <span class="pyear">${project.year} · ${project.location}</span>
    </div>
    <h3>${project.title}</h3>
    <p class="pplant">${project.client}</p>
    <p class="pdesc">${project.description}</p>
  `;
  body.appendChild(tagsEl);

  card.append(cover, dots, body);
  return card;
}

/** Apply current filter visibility to all cards */
function applyFilter(filter) {
  currentFilter = filter;
  document.querySelectorAll('.pcard:not(.extra)').forEach(c => {
    c.style.display = (filter === 'all' || c.dataset.tag === filter) ? 'flex' : 'none';
  });
  if (showAllState) {
    document.querySelectorAll('.pcard.extra').forEach(c => {
      c.style.display = (filter === 'all' || c.dataset.tag === filter) ? 'flex' : 'none';
    });
  }
}

/** Toggle show all / show fewer */
function toggleShowMore() {
  showAllState = !showAllState;
  document.querySelectorAll('.pcard.extra').forEach(c => {
    if (showAllState) {
      c.style.display = (currentFilter === 'all' || c.dataset.tag === currentFilter) ? 'flex' : 'none';
    } else {
      c.style.display = 'none';
    }
  });
  document.getElementById('smLabel').textContent = showAllState ? 'Show fewer projects' : 'Show more projects';
  document.getElementById('smBtn').classList.toggle('open', showAllState);
}

/** Main initialiser — fetch projects.json and render */
async function initProjects() {
  let projects = [];
  try {
    const res = await fetch('./data/projects.json');
    projects = await res.json();
  } catch (e) {
    console.error('Could not load projects.json:', e);
    return;
  }

  const grid = document.getElementById('pgrid');
  projects.forEach((p, i) => grid.appendChild(renderCard(p, i)));

  /* Filter buttons */
  document.querySelectorAll('.fbtn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.fbtn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilter(btn.dataset.filter);
    });
  });

  /* Show more button */
  document.getElementById('smBtn').addEventListener('click', toggleShowMore);
}

document.addEventListener('DOMContentLoaded', initProjects);
