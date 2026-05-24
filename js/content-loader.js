/**
 * content-loader.js
 * Fetches all JSON data files and renders every section dynamically.
 *
 * EDITABLE CONTENT:
 *   data/hero.json       → name, role, tagline, pills, CTA buttons
 *   data/about.json      → bio paragraphs, contact links
 *   data/experience.json → timeline entries
 *   data/skills.json     → skill categories and tags
 *   data/education.json  → degrees
 *   data/contact.json    → contact section heading, buttons, footer
 *
 * All paths are relative so GitHub Pages works with no config.
 */

/* ── SVG icon library (inline, no external dependency) ── */
const ICONS = {
  email: `<svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>`,
  linkedin: `<svg viewBox="0 0 24 24"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.11 20.45H3.56V9h3.55v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.73V1.73C24 .77 23.21 0 22.23 0z"/></svg>`,
  globe: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>`,
  document: `<svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>`,
};

/* ── HERO ── */
async function loadHero() {
  const data = await fetchJSON('./data/hero.json');
  if (!data) return;

  /* Name — replace \n with <br> */
  document.getElementById('heroName').innerHTML = data.name.replace('\n', '<br>');
  document.getElementById('heroTag').textContent  = data.tag;
  document.getElementById('heroRole').textContent = data.role;
  document.getElementById('heroDesc').textContent = data.description;

  /* Pills */
  const pillsEl = document.getElementById('heroPills');
  data.pills.forEach(p => {
    const span = document.createElement('span');
    span.className = 'hero-pill';
    span.textContent = p;
    pillsEl.appendChild(span);
  });

  /* CTA buttons */
  const ctaEl = document.getElementById('heroCta');
  data.cta.forEach(btn => {
    const a = document.createElement('a');
    a.className = `btn ${btn.class}`;
    a.href = btn.href;
    a.textContent = btn.label;
    if (btn.target) a.target = btn.target;
    ctaEl.appendChild(a);
  });
}

/* ── ABOUT ── */
async function loadAbout() {
  const data = await fetchJSON('./data/about.json');
  if (!data) return;

  /* Heading */
  document.getElementById('aboutHeading').innerHTML = data.heading.replace('\n', '<br>');

  /* Paragraphs */
  const textEl = document.getElementById('aboutParagraphs');
  data.paragraphs.forEach(p => {
    const el = document.createElement('p');
    el.textContent = p;
    textEl.appendChild(el);
  });

  /* Contact links */
  const linksEl = document.getElementById('aboutLinks');
  data.links.forEach(link => {
    const a = document.createElement('a');
    a.href = link.href;
    if (link.target) a.target = link.target;
    a.innerHTML = (ICONS[link.icon] || '') + link.label;
    linksEl.appendChild(a);
  });
}

/* ── EXPERIENCE TIMELINE ── */
async function loadExperience() {
  const items = await fetchJSON('./data/experience.json');
  if (!items) return;

  const timeline = document.getElementById('timeline');
  items.forEach(item => {
    const isPresent = item.yearEnd === 'Present';
    const div = document.createElement('div');
    div.className = 'titem';
    div.innerHTML = `
      <span class="tyear tyear-range">${item.yearStart}<br>${item.yearEnd}</span>
      <div>
        <span class="tdot"></span>
        <div class="ttitle-row">
          <p class="ttitle">${item.title}</p>
          ${isPresent ? '<span class="tpresent">Present</span>' : ''}
        </div>
        <p class="tco">${item.company}</p>
        <p class="tdesc">${item.description}</p>
      </div>
    `;
    timeline.appendChild(div);
  });
}

/* ── SKILLS ── */
async function loadSkills() {
  const blocks = await fetchJSON('./data/skills.json');
  if (!blocks) return;

  const container = document.getElementById('skillsBlocks');
  blocks.forEach(block => {
    const div = document.createElement('div');
    div.className = 'skill-block';

    const title = document.createElement('p');
    title.className = 'skill-block-title';
    title.textContent = block.category;
    div.appendChild(title);

    const list = document.createElement('div');
    list.className = 'skill-list';
    block.skills.forEach(s => {
      const span = document.createElement('span');
      span.className = 'stag' + (s.highlight ? ' hi' : '');
      span.textContent = s.name;
      list.appendChild(span);
    });
    div.appendChild(list);
    container.appendChild(div);
  });
}

/* ── EDUCATION ── */
async function loadEducation() {
  const items = await fetchJSON('./data/education.json');
  if (!items) return;

  const grid = document.getElementById('eduGrid');
  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'edu-card';
    card.innerHTML = `
      <p class="edu-deg">${item.degree}</p>
      <p class="edu-school">${item.school}</p>
      <p class="edu-meta">${item.meta}</p>
      <p class="edu-thesis">${item.thesis}</p>
    `;
    grid.appendChild(card);
  });
}

/* ── CONTACT ── */
async function loadContact() {
  const data = await fetchJSON('./data/contact.json');
  if (!data) return;

  document.getElementById('contactHeading').innerHTML = data.heading.replace('\n', '<br>');
  document.getElementById('contactTagline').textContent = data.tagline;
  document.getElementById('footerText').textContent = data.footer;

  const ctaEl = document.getElementById('contactCta');
  data.buttons.forEach(btn => {
    const a = document.createElement('a');
    a.className = `btn ${btn.class}`;
    a.href = btn.href;
    a.textContent = btn.label;
    if (btn.target) a.target = btn.target;
    ctaEl.appendChild(a);
  });
}

/* ── UTILITY ── */
async function fetchJSON(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error(`Failed to load ${path}:`, e);
    return null;
  }
}

/* ── BOOT ── */
document.addEventListener('DOMContentLoaded', () => {
  loadHero();
  loadAbout();
  loadExperience();
  loadSkills();
  loadEducation();
  loadContact();
});
