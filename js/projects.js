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

const ALBUM_ICON_SVG = `<svg viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>`;
const COVER_DRAG_THRESHOLD = 40;

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
  card.querySelector('.pcover > img').src = images[idx];
  card.querySelectorAll('.pthumb').forEach((t, i) => t.classList.toggle('active', i === idx));
}

/** Switch cover image when thumbnail is clicked */
function switchCover(thumb) {
  const card = thumb.closest('.pcard');
  const images = card.dataset.images.split(',');
  const thumbs = [...card.querySelectorAll('.pthumb')];
  setCoverIndex(card, images, thumbs.indexOf(thumb));
}

/** Drag left/right on cover to browse album images; click opens lightbox */
function initCoverInteraction(cover, images, card, title) {
  if (images.length > 1) cover.classList.add('has-album');

  let dragging = false;
  let moved = false;
  let startX = 0;

  cover.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    dragging = true;
    moved = false;
    startX = e.clientX;
    cover.setPointerCapture(e.pointerId);
    cover.classList.add('dragging');
  });

  cover.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 5) moved = true;
    if (images.length > 1) {
      cover.querySelector('img').style.transform = `translateX(${dx * 0.25}px)`;
    }
  });

  const endDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    cover.classList.remove('dragging');
    cover.releasePointerCapture(e.pointerId);
    cover.querySelector('img').style.transform = '';

    const dx = e.clientX - startX;
    if (images.length > 1 && moved && Math.abs(dx) >= COVER_DRAG_THRESHOLD) {
      setCoverIndex(card, images, getCoverIndex(card) + (dx < 0 ? 1 : -1));
      return;
    }
    if (!moved) openLightbox(images, title, getCoverIndex(card));
  };

  cover.addEventListener('pointerup', endDrag);
  cover.addEventListener('pointercancel', endDrag);
}

/** Render a single project card DOM element */
function renderCard(project) {
  const images  = buildImagePaths(project.id, project.images);
  const isExtra = !project.featured;

  const card = document.createElement('div');
  card.className = 'pcard' + (isExtra ? ' extra' : '');
  card.dataset.tag        = project.category;
  card.dataset.images     = images.join(',');
  card.dataset.title      = project.title;
  card.dataset.coverIndex = '0';

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
  overlay.innerHTML = `<span class="album-hint">${ALBUM_ICON_SVG}View album</span>`;

  const cover = document.createElement('div');
  cover.className = 'pcover';
  cover.append(coverImg, overlay);
  initCoverInteraction(cover, images, card, project.title);

  /* Thumbnail strip */
  const strip = document.createElement('div');
  strip.className = 'pthumb-strip';
  images.forEach((src, i) => {
    const th = document.createElement('img');
    th.className = 'pthumb' + (i === 0 ? ' active' : '');
    th.src = src;
    th.alt = '';
    th.onerror = () => {
      th.onerror = null;
      th.src = `https://placehold.co/96x72/1a1c1f/b89b6a?text=${i + 1}`;
    };
    th.addEventListener('click', () => switchCover(th));
    strip.appendChild(th);
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

  card.append(cover, strip, body);
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
  projects.forEach(p => grid.appendChild(renderCard(p)));

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
