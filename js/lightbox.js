/**
 * lightbox.js
 * Handles the full-screen image lightbox.
 * Triggered by projects.js when user clicks a project cover image.
 *
 * Public API:
 *   openLightbox(images, title)  — open with array of image paths + project title
 */

let lbImgs  = [];
let lbIdx   = 0;
let lbTitle = '';

/** Build thumbnail strip inside the lightbox */
function renderLightbox() {
  const img = document.getElementById('lbImg');
  img.src = lbImgs[lbIdx];
  img.onerror = () => {
    img.onerror = null;
    img.src = `https://placehold.co/800x500/1a1c1f/b89b6a?text=Image+${lbIdx + 1}`;
  };

  document.getElementById('lbCap').textContent =
    (lbTitle ? lbTitle + ' — ' : '') + `Image ${lbIdx + 1} of ${lbImgs.length}`;

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
  const img = document.getElementById('lbImg');
  img.src = lbImgs[lbIdx];
  img.onerror = () => {
    img.onerror = null;
    img.src = `https://placehold.co/800x500/1a1c1f/b89b6a?text=Image+${lbIdx + 1}`;
  };
  document.getElementById('lbCap').textContent =
    (lbTitle ? lbTitle + ' — ' : '') + `Image ${lbIdx + 1} of ${lbImgs.length}`;
  document.querySelectorAll('.lb-thumb').forEach((t, i) => t.classList.toggle('active', i === lbIdx));
}

/** Navigate by delta (-1 prev, +1 next) */
function lbNav(delta) {
  lbIdx = (lbIdx + delta + lbImgs.length) % lbImgs.length;
  updateLightbox();
}

function closeLightbox() {
  document.getElementById('lb').classList.remove('open');
  document.body.style.overflow = '';
}

/** Called by projects.js */
function openLightbox(images, title) {
  if (!images || images.length === 0) return;
  lbImgs  = images;
  lbTitle = title || '';
  lbIdx   = 0;
  renderLightbox();
  document.getElementById('lb').classList.add('open');
  document.body.style.overflow = 'hidden';
}

/* ── Wire up static lightbox buttons after DOM ready ── */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('lbClose').addEventListener('click', closeLightbox);
  document.getElementById('lbPrev').addEventListener('click', () => lbNav(-1));
  document.getElementById('lbNext').addEventListener('click', () => lbNav(1));

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
  });
});
