/**
 * lightbox.js
 * Full-screen album viewer with zoom and pan.
 *
 * Public API:
 *   openLightbox(images, title, startIndex)
 */

let lbImgs  = [];
let lbIdx   = 0;
let lbTitle = '';
let lbZoom  = 1;
let lbPanX  = 0;
let lbPanY  = 0;

const LB_MIN_ZOOM = 1;
const LB_MAX_ZOOM = 4;
const LB_CLICK_ZOOM = 2.5;
const LB_DRAG_THRESHOLD = 40;

/** Sync album UI state on the lightbox stage */
function syncLbStageState() {
  document.getElementById('lbStage').classList.toggle('has-album', lbImgs.length > 1);
}

/** Apply current zoom / pan transform to the main image */
function applyLbTransform() {
  const img = document.getElementById('lbImg');
  img.style.transform = `translate(${lbPanX}px, ${lbPanY}px) scale(${lbZoom})`;
  document.getElementById('lbStage').classList.toggle('zoomed', lbZoom > 1);
}

/** Reset zoom when switching images or closing */
function resetLbZoom() {
  lbZoom = 1;
  lbPanX = 0;
  lbPanY = 0;
  applyLbTransform();
}

/** Build thumbnail strip inside the lightbox */
function renderLightbox() {
  resetLbZoom();

  const img = document.getElementById('lbImg');
  img.src = lbImgs[lbIdx];
  img.onerror = () => {
    img.onerror = null;
    img.src = `https://placehold.co/800x500/1a1c1f/b89b6a?text=Image+${lbIdx + 1}`;
  };

  document.getElementById('lbCap').textContent =
    (lbTitle ? lbTitle + ' — ' : '') + `Image ${lbIdx + 1} of ${lbImgs.length}`;

  syncLbStageState();

  const tb = document.getElementById('lbThumbs');
  tb.innerHTML = '';
  lbImgs.forEach((src, i) => {
    const t = document.createElement('img');
    t.className = 'lb-thumb' + (i === lbIdx ? ' active' : '');
    t.src = src;
    t.alt = `Thumbnail ${i + 1}`;
    t.onerror = () => { t.onerror = null; t.src = `https://placehold.co/96x72/1a1c1f/b89b6a?text=${i + 1}`; };
    t.addEventListener('click', () => { lbIdx = i; updateLightbox(); });
    tb.appendChild(t);
  });
}

/** Update main image and thumbnail highlights without rebuilding strip */
function updateLightbox() {
  resetLbZoom();

  const img = document.getElementById('lbImg');
  img.src = lbImgs[lbIdx];
  img.onerror = () => {
    img.onerror = null;
    img.src = `https://placehold.co/800x500/1a1c1f/b89b6a?text=Image+${lbIdx + 1}`;
  };
  document.getElementById('lbCap').textContent =
    (lbTitle ? lbTitle + ' — ' : '') + `Image ${lbIdx + 1} of ${lbImgs.length}`;
  document.querySelectorAll('.lb-thumb').forEach((t, i) => t.classList.toggle('active', i === lbIdx));
  syncLbStageState();
}

/** Navigate by delta (-1 prev, +1 next) */
function lbNav(delta) {
  lbIdx = (lbIdx + delta + lbImgs.length) % lbImgs.length;
  updateLightbox();
}

function closeLightbox() {
  resetLbZoom();
  document.getElementById('lb').classList.remove('open');
  document.body.style.overflow = '';
}

/** Called by projects.js */
function openLightbox(images, title, startIndex = 0) {
  if (!images || images.length === 0) return;
  lbImgs  = images;
  lbTitle = title || '';
  lbIdx   = Math.max(0, Math.min(startIndex, images.length - 1));
  renderLightbox();
  document.getElementById('lb').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function setLbZoom(nextZoom) {
  lbZoom = Math.min(LB_MAX_ZOOM, Math.max(LB_MIN_ZOOM, nextZoom));
  if (lbZoom === 1) {
    lbPanX = 0;
    lbPanY = 0;
  }
  applyLbTransform();
}

function toggleLbZoom() {
  setLbZoom(lbZoom === 1 ? LB_CLICK_ZOOM : 1);
}

/** Wire zoom, pan, and drag-to-browse on the lightbox stage */
function initLightboxZoom() {
  const stage = document.getElementById('lbStage');
  let active = false;
  let moved = false;
  let startX = 0;
  let startY = 0;
  let panStartX = 0;
  let panStartY = 0;

  stage.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.25 : 0.25;
    setLbZoom(lbZoom + delta);
  }, { passive: false });

  stage.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    active = true;
    moved = false;
    startX = e.clientX;
    startY = e.clientY;
    panStartX = lbPanX;
    panStartY = lbPanY;
    stage.setPointerCapture(e.pointerId);
    stage.classList.add('dragging');
  });

  stage.addEventListener('pointermove', (e) => {
    if (!active) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved = true;

    if (lbZoom > 1) {
      lbPanX = panStartX + dx;
      lbPanY = panStartY + dy;
      applyLbTransform();
    } else if (lbImgs.length > 1) {
      document.getElementById('lbImg').style.transform = `translateX(${dx * 0.25}px)`;
    }
  });

  const endInteraction = (e) => {
    if (!active || e.button !== 0) return;
    active = false;
    stage.classList.remove('dragging');
    stage.releasePointerCapture(e.pointerId);

    const dx = e.clientX - startX;
    const img = document.getElementById('lbImg');

    if (lbZoom <= 1 && lbImgs.length > 1 && moved && Math.abs(dx) >= LB_DRAG_THRESHOLD) {
      img.style.transform = '';
      lbNav(dx < 0 ? 1 : -1);
    } else {
      if (lbZoom <= 1) img.style.transform = '';
      if (!moved) {
        e.stopPropagation();
        toggleLbZoom();
      }
    }
    moved = false;
  };

  stage.addEventListener('pointerup', endInteraction);
  stage.addEventListener('pointercancel', endInteraction);
}

/* ── Wire up static lightbox buttons after DOM ready ── */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('lbClose').addEventListener('click', closeLightbox);
  document.getElementById('lbPrev').addEventListener('click', () => lbNav(-1));
  document.getElementById('lbNext').addEventListener('click', () => lbNav(1));
  initLightboxZoom();

  /* Close on background click */
  document.getElementById('lb').addEventListener('click', (e) => {
    if (e.target === document.getElementById('lb')) closeLightbox();
  });

  /* Keyboard navigation */
  document.addEventListener('keydown', (e) => {
    if (!document.getElementById('lb').classList.contains('open')) return;
    if (e.key === 'Escape')      closeLightbox();
    if (e.key === 'ArrowLeft')   lbNav(-1);
    if (e.key === 'ArrowRight')  lbNav(1);
    if (e.key === '+' || e.key === '=') setLbZoom(lbZoom + 0.25);
    if (e.key === '-')            setLbZoom(lbZoom - 0.25);
  });
});
