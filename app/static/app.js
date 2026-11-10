'use strict';
/* Galerie für ZimaOS – Oberfläche (ohne Build-Schritt, reines JavaScript) */

const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ico = (d, fill) => `<svg viewBox="0 0 24 24" class="ico" aria-hidden="true" ${fill ? 'fill="currentColor"' : 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"'}>${d}</svg>`;
const HEART = '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>';
const I = {
  photos: ico('<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>'),
  coll: ico('<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M6 5h12M8.5 2h7"/>'),
  imp: ico('<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>'),
  gear: ico('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  heart: ico(HEART), heartF: ico(HEART, true),
  trash: ico('<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/>'),
  dl: ico('<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>'),
  tag: ico('<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>'),
  folder: ico('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'),
  more: ico('<circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/>', true),
  plus: ico('<path d="M12 5v14M5 12h14"/>'), minus: ico('<path d="M5 12h14"/>'),
  info: ico('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
  close: ico('<path d="M6 6l12 12M18 6L6 18"/>'),
  back: ico('<path d="M15 5l-7 7 7 7"/>'), next: ico('<path d="M9 5l7 7-7 7"/>'),
  video: ico('<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/>'),
  image: ico('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>'),
  phone: ico('<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>'),
  restore: ico('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>'),
  cal: ico('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  out: ico('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 13h6"/>'),
  notag: ico('<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><path d="M4 20L20 4"/>'),
};

/* ------------------------------------------------------------- Zustand & API */
const S = { settings: { order: 'desc', tile: 110, badges: true, trash_days: 30 }, labels: [], albums: [], labelMap: {}, albumMap: {} };

async function api(path, opts = {}) {
  const isJson = opts.body && !(opts.body instanceof FormData);
  const r = await fetch(path, { ...opts, headers: isJson ? { 'Content-Type': 'application/json' } : {}, body: isJson ? JSON.stringify(opts.body) : opts.body });
  if (!r.ok) {
    let msg = r.statusText;
    try { msg = (await r.json()).detail || msg; } catch { /* leer */ }
    throw new Error(msg);
  }
  return r.json();
}
async function loadLabels() { S.labels = await api('/api/labels'); S.labelMap = Object.fromEntries(S.labels.map(l => [l.id, l])); }
async function loadAlbums() { S.albums = await api('/api/albums'); S.albumMap = Object.fromEntries(S.albums.map(a => [a.id, a])); }
async function saveSettings(patch) { S.settings = await api('/api/settings', { method: 'PUT', body: { ...S.settings, ...patch } }); applySettings(); }
function applySettings() { document.documentElement.style.setProperty('--tile', S.settings.tile + 'px'); }

/* ------------------------------------------------------------- Formatierung */
const toDate = t => new Date(t.replace(' ', 'T'));
const fmtMonth = t => toDate(t).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
const fmtDay = t => toDate(t).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const fmtShort = d => new Date(d + 'T12:00').toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtTime = t => toDate(t).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
const fmtDur = s => s == null ? '' : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const fmtBytes = b => { const u = ['B', 'KB', 'MB', 'GB', 'TB']; let i = 0; while (b >= 1024 && i < 4) { b /= 1024; i++; } return `${b.toFixed(i > 1 ? 1 : 0)} ${u[i]}`; };
const plural = (n, one, many) => `${n.toLocaleString('de-DE')} ${n === 1 ? one : many}`;

function labelBadge(lid, cls = 'badge') {
  const l = S.labelMap[lid];
  if (!l) return '';
  if (l.logo_url) return `<img class="${cls}" src="${l.logo_url}" alt="${esc(l.name)}" title="${esc(l.name)}">`;
  return `<span class="${cls} txt" style="background:${esc(l.color)}" title="${esc(l.name)}">${esc(l.name[0].toUpperCase())}</span>`;
}
function logoPrev(l) {
  return l.logo_url ? `<img class="logo-prev" src="${l.logo_url}" alt="">` : `<span class="logo-prev" style="background:${esc(l.color)}">${esc(l.name[0].toUpperCase())}</span>`;
}

/* ------------------------------------------------------------- UI-Bausteine */
let toastTimer;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}
function modal(html, onMount) {
  const bg = document.createElement('div'); bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
  const close = () => bg.remove();
  bg.addEventListener('click', e => { if (e.target === bg || e.target.closest('[data-close]')) close(); });
  $('#modal-root').append(bg);
  onMount && onMount(bg.firstElementChild, close);
  const first = bg.querySelector('input, select'); first && first.focus();
  return close;
}
function confirmBox(title, text, okLabel = 'Löschen', danger = true) {
  return new Promise(res => {
    modal(`<h3>${esc(title)}</h3><p>${esc(text)}</p><div class="foot"><button class="pill" data-close>Abbrechen</button><button class="pill ${danger ? 'danger' : 'primary'}" id="ok">${esc(okLabel)}</button></div>`,
      (m, close) => { $('#ok', m).onclick = () => { close(); res(true); }; m.parentElement.addEventListener('click', e => { if (e.target === m.parentElement || e.target.closest('[data-close]')) res(false); }); });
  });
}
function sheet(title, items) { // items: [{label, icon, danger, run}]
  modal(`${title ? `<h3>${esc(title)}</h3>` : ''}<div class="list">${items.map((it, i) => `<button class="row" data-i="${i}" ${it.danger ? 'style="color:var(--danger)"' : ''}><span class="ic" ${it.danger ? 'style="color:var(--danger)"' : ''}>${it.icon || ''}</span><span class="lbl">${esc(it.label)}</span></button>`).join('')}</div><div class="foot"><button class="pill" data-close>Abbrechen</button></div>`,
    (m, close) => m.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { close(); items[+b.dataset.i].run(); }));
}
function setHeader(title, { subtitle = '', back = null, actions = '' } = {}) {
  $('#title').textContent = title;
  $('#subtitle').innerHTML = subtitle;
  const b = $('#back');
  b.classList.toggle('hidden', !back);
  b.onclick = () => { location.hash = back; };
  $('#actions').innerHTML = actions;
  requestAnimationFrame(() => document.documentElement.style.setProperty('--hdr', $('.topbar').offsetHeight + 'px'));
}

/* ------------------------------------------------------------- Raster (Mediathek, Alben, Filter) */
const G = { items: [], sel: new Set(), selecting: false, lastIdx: null, opts: {}, rendered: 0, host: null, wrap: null, sentinel: null, obs: null, curKey: null, curGrid: null, reload: null };

function mountGrid(host, items, opts = {}) {
  G.items = items; G.opts = opts; G.sel.clear(); G.lastIdx = null; G.host = host;
  setSelecting(false, true);
  renderGrid(0);
}
function renderGrid(minRendered) {
  const host = G.host;
  if (G.obs) G.obs.disconnect();
  host.innerHTML = ''; G.rendered = 0; G.curKey = null;
  if (!G.items.length) { host.innerHTML = `<div class="empty">${G.opts.empty || '<strong>Keine Objekte</strong>'}</div>`; updateSelbar(); return; }
  G.wrap = document.createElement('div'); G.wrap.className = 'gridwrap' + (G.selecting ? ' selecting' : '');
  G.sentinel = document.createElement('div'); G.sentinel.style.height = '1px';
  host.append(G.wrap, G.sentinel);
  bindGridEvents(G.wrap);
  G.obs = new IntersectionObserver(es => { if (es[0].isIntersecting) renderMore(); }, { rootMargin: '1200px' });
  G.obs.observe(G.sentinel);
  do renderMore(); while (G.rendered < Math.min(minRendered || 0, G.items.length));
}
function groupKey(it) { return G.opts.group === 'none' ? '' : (G.opts.group === 'day' ? it.t.slice(0, 10) : it.t.slice(0, 7)); }
function renderMore() {
  const end = Math.min(G.items.length, G.rendered + 240);
  const frag = document.createDocumentFragment();
  for (let i = G.rendered; i < end; i++) {
    const it = G.items[i], k = groupKey(it);
    if (k !== G.curKey || !G.curGrid) {
      G.curKey = k;
      if (k) { const h = document.createElement('div'); h.className = 'group-h'; h.textContent = G.opts.group === 'day' ? fmtDay(it.t) : fmtMonth(it.t); frag.append(h); }
      G.curGrid = document.createElement('div'); G.curGrid.className = 'grid'; frag.append(G.curGrid);
    }
    G.curGrid.append(tileEl(it, i));
  }
  G.wrap.append(frag);
  G.rendered = end;
  if (end >= G.items.length) { G.obs.disconnect(); return; }
  requestAnimationFrame(() => { if (G.sentinel.getBoundingClientRect().top < innerHeight + 1200) renderMore(); });
}
function tileEl(it, i) {
  const d = document.createElement('div');
  d.className = 'tile' + (G.sel.has(it.id) ? ' sel' : '');
  d.dataset.i = i;
  d.innerHTML = tileInner(it);
  return d;
}
function tileInner(it) {
  let h = `<img class="th" loading="lazy" decoding="async" src="/api/media/${it.id}/thumb" alt="">`;
  if (it.k === 'v') h += `<span class="dur">${fmtDur(it.d)}</span>`;
  if (it.f) h += `<span class="fav">${I.heartF}</span>`;
  if (G.opts.trash && it.x) {
    const left = Math.max(0, S.settings.trash_days - Math.floor((Date.now() - toDate(it.x)) / 864e5));
    h += `<span class="left">${plural(left, 'Tag', 'Tage')}</span>`;
  } else if (S.settings.badges && it.l && S.labelMap[it.l]?.show_badge) h += labelBadge(it.l);
  return h + '<span class="check"></span>';
}
function refreshTile(id) {
  const i = G.items.findIndex(x => x.id === id);
  const el = G.wrap && G.wrap.querySelector(`.tile[data-i="${i}"]`);
  if (el) el.innerHTML = tileInner(G.items[i]);
}
function bindGridEvents(wrap) {
  let timer = null, longFired = false, sx = 0, sy = 0;
  wrap.addEventListener('pointerdown', e => {
    const t = e.target.closest('.tile'); if (!t) return;
    longFired = false; sx = e.clientX; sy = e.clientY;
    timer = setTimeout(() => { longFired = true; if (!G.selecting) setSelecting(true); toggleSel(+t.dataset.i, false); if (navigator.vibrate) navigator.vibrate(10); }, 480);
  });
  const cancel = () => clearTimeout(timer);
  wrap.addEventListener('pointerup', cancel);
  wrap.addEventListener('pointercancel', cancel);
  wrap.addEventListener('pointermove', e => { if (Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) > 10) cancel(); });
  wrap.addEventListener('contextmenu', e => { if (e.target.closest('.tile')) e.preventDefault(); });
  wrap.addEventListener('click', e => {
    const t = e.target.closest('.tile'); if (!t) return;
    if (longFired) { longFired = false; return; }
    const i = +t.dataset.i;
    if (G.selecting) toggleSel(i, e.shiftKey); else openLightbox(i);
  });
}
function toggleSel(i, range) {
  if (range && G.lastIdx != null) {
    const [a, b] = [Math.min(G.lastIdx, i), Math.max(G.lastIdx, i)];
    for (let k = a; k <= b; k++) G.sel.add(G.items[k].id);
  } else {
    const id = G.items[i].id;
    G.sel.has(id) ? G.sel.delete(id) : G.sel.add(id);
  }
  G.lastIdx = i;
  refreshSel();
}
function refreshSel() {
  G.wrap && G.wrap.querySelectorAll('.tile').forEach(el => el.classList.toggle('sel', G.sel.has(G.items[+el.dataset.i].id)));
  updateSelbar();
}
function setSelecting(on, silent) {
  G.selecting = on;
  if (!on) G.sel.clear();
  if (G.wrap) { G.wrap.classList.toggle('selecting', on); if (!on) G.wrap.querySelectorAll('.tile.sel').forEach(el => el.classList.remove('sel')); }
  const b = $('#selbtn'); if (b) b.textContent = on ? 'Fertig' : 'Auswählen';
  const all = $('#selall'); if (all) all.classList.toggle('hidden', !on);
  if (!silent) updateSelbar(); else $('#selbar').classList.add('hidden');
}
function updateSelbar() {
  const bar = $('#selbar');
  if (!G.selecting) { bar.classList.add('hidden'); return; }
  const n = G.sel.size, dis = n ? '' : 'disabled';
  let btns;
  if (G.opts.trash) {
    btns = `<button class="icon-btn" data-act="restore" ${dis} title="Wiederherstellen">${I.restore}</button><button class="icon-btn" data-act="purge" ${dis} title="Endgültig löschen" style="color:var(--danger)">${I.trash}</button>`;
  } else {
    btns = `<button class="icon-btn" data-act="fav" ${dis} title="Favorit">${I.heart}</button>
      <button class="icon-btn" data-act="label" ${dis} title="Label vergeben">${I.tag}</button>
      <button class="icon-btn" data-act="album" ${dis} title="In Album verschieben">${I.folder}</button>
      <button class="icon-btn" data-act="download" ${dis} title="Als ZIP herunterladen">${I.dl}</button>
      <button class="icon-btn" data-act="trash" ${dis} title="Löschen" style="color:var(--danger)">${I.trash}</button>
      <button class="icon-btn" data-act="more" ${dis} title="Mehr">${I.more}</button>`;
  }
  bar.innerHTML = `<span class="cnt">${n ? plural(n, 'Objekt', 'Objekte') : 'Objekte auswählen'}</span>${btns}`;
  bar.classList.remove('hidden');
  bar.querySelectorAll('[data-act]').forEach(b => b.onclick = () => selAction(b.dataset.act));
}
function gridActions(extra = '') {
  return `${extra}<button class="icon-btn" id="zoomout" title="Kleiner">${I.minus}</button><button class="icon-btn" id="zoomin" title="Größer">${I.plus}</button>
    <button class="pill hidden" id="selall">Alle</button><button class="pill" id="selbtn">Auswählen</button>`;
}
function bindGridActions() {
  $('#selbtn').onclick = () => setSelecting(!G.selecting);
  $('#selall').onclick = () => { const all = G.sel.size === G.items.length; G.sel.clear(); if (!all) G.items.forEach(x => G.sel.add(x.id)); refreshSel(); };
  const steps = [56, 72, 90, 110, 140, 180, 240];
  const zoom = dir => { const cur = steps.findIndex(s => s >= S.settings.tile); const n = steps[Math.min(steps.length - 1, Math.max(0, (cur < 0 ? 3 : cur) + dir))]; saveSettings({ tile: n }); };
  $('#zoomin').onclick = () => zoom(1); $('#zoomout').onclick = () => zoom(-1);
}

/* Aktionen für mehrere ausgewählte Objekte */
async function bulk(action, value, ids = [...G.sel]) {
  return api('/api/media/bulk', { method: 'POST', body: { ids, action, value } });
}
function removeFromGrid(ids) {
  const set = new Set(ids), keep = G.rendered, y = scrollY;
  G.items = G.items.filter(x => !set.has(x.id));
  ids.forEach(id => G.sel.delete(id));
  renderGrid(keep); scrollTo(0, y); updateSelbar();
}
async function selAction(act) {
  const ids = [...G.sel]; if (!ids.length) return;
  try {
    if (act === 'fav') {
      const val = !ids.every(id => G.items.find(x => x.id === id)?.f);
      await bulk('favorite', val, ids);
      G.items.forEach(x => { if (G.sel.has(x.id)) x.f = val ? 1 : 0; });
      if (G.opts.favorites && !val) removeFromGrid(ids); else ids.forEach(refreshTile);
      toast(val ? 'Zu Favoriten hinzugefügt' : 'Aus Favoriten entfernt');
    } else if (act === 'label') {
      pickLabel(async lid => {
        await bulk('label', lid, ids);
        G.items.forEach(x => { if (G.sel.has(x.id)) x.l = lid; });
        if (G.opts.labelFilter != null && G.opts.labelFilter !== (lid || 0)) removeFromGrid(ids); else ids.forEach(refreshTile);
        await loadLabels(); toast(lid ? `Label „${S.labelMap[lid].name}“ vergeben` : 'Label entfernt');
      });
    } else if (act === 'album') {
      pickAlbum(async aid => {
        await bulk('album', aid, ids);
        G.items.forEach(x => { if (G.sel.has(x.id)) x.a = aid; });
        if (G.opts.album && G.opts.album !== aid) removeFromGrid(ids);
        await loadAlbums(); toast(`In „${S.albumMap[aid].name}“ verschoben`);
      });
    } else if (act === 'download') {
      downloadZip(ids);
    } else if (act === 'trash') {
      if (!await confirmBox(`${plural(ids.length, 'Objekt', 'Objekte')} löschen?`, `Die Objekte werden in „Zuletzt gelöscht“ verschoben und nach ${S.settings.trash_days} Tagen endgültig entfernt.`)) return;
      await bulk('trash', null, ids); removeFromGrid(ids); toast('In „Zuletzt gelöscht“ verschoben');
    } else if (act === 'restore') {
      await bulk('restore', null, ids); removeFromGrid(ids); toast('Wiederhergestellt');
    } else if (act === 'purge') {
      if (!await confirmBox('Endgültig löschen?', `${plural(ids.length, 'Objekt wird', 'Objekte werden')} unwiderruflich von der Festplatte gelöscht.`)) return;
      await bulk('purge', null, ids); removeFromGrid(ids); toast('Endgültig gelöscht');
    } else if (act === 'more') {
      const items = [
        { label: 'Aufnahmedatum ändern', icon: I.cal, run: () => pickDate(ids) },
        { label: 'Label entfernen', icon: I.notag, run: async () => { await bulk('label', null, ids); G.items.forEach(x => { if (G.sel.has(x.id)) x.l = null; }); ids.forEach(refreshTile); loadLabels(); toast('Label entfernt'); } },
      ];
      if (G.opts.album) items.push({ label: 'Aus Album entfernen', icon: I.out, run: async () => { await bulk('unalbum', null, ids); removeFromGrid(ids); loadAlbums(); toast('Aus Album entfernt – bleibt in der Mediathek'); } });
      if (G.opts.album && ids.length === 1) items.push({ label: 'Als Albumcover verwenden', icon: I.image, run: async () => { await api(`/api/albums/${G.opts.album}`, { method: 'PATCH', body: { cover_id: ids[0] } }); loadAlbums(); toast('Albumcover gesetzt'); } });
      sheet(plural(ids.length, 'Objekt', 'Objekte'), items);
    }
  } catch (e) { toast(e.message); }
}
function downloadZip(ids) {
  const f = document.createElement('form');
  f.method = 'POST'; f.action = '/api/download'; f.style.display = 'none';
  f.innerHTML = `<input name="ids" value="${ids.join(',')}">`;
  document.body.append(f); f.submit(); f.remove();
  toast('ZIP wird vorbereitet …');
}
function pickLabel(cb) {
  modal(`<h3>Label vergeben</h3><div class="pick list">
    ${S.labels.map(l => `<button class="row" data-id="${l.id}">${logoPrev(l)}<span class="lbl">${esc(l.name)}</span></button>`).join('')}
    <button class="row" data-id=""><span class="ic">${I.notag}</span><span class="lbl">Kein Label</span></button></div>
    <div class="foot"><a class="pill" href="#/einstellungen" data-close>Labels verwalten</a><span class="spacer"></span><button class="pill" data-close>Abbrechen</button></div>`,
    (m, close) => m.querySelectorAll('[data-id]').forEach(b => b.onclick = () => { close(); cb(b.dataset.id ? +b.dataset.id : null); }));
}
function pickAlbum(cb) {
  modal(`<h3>In Album verschieben</h3><div class="pick list">
    <button class="row" data-new><span class="ic">${I.plus}</span><span class="lbl">Neues Album …</span></button>
    ${S.albums.map(a => `<button class="row" data-id="${a.id}"><span class="ic">${I.folder}</span><span class="lbl">${esc(a.name)}<small>${fmtShort(a.date)}${a.label_id && S.labelMap[a.label_id] ? ' · ' + esc(S.labelMap[a.label_id].name) : ''}</small></span><span class="val">${a.count}</span></button>`).join('')}</div>
    <div class="foot"><button class="pill" data-close>Abbrechen</button></div>`,
    (m, close) => {
      m.querySelectorAll('[data-id]').forEach(b => b.onclick = () => { close(); cb(+b.dataset.id); });
      $('[data-new]', m).onclick = () => { close(); albumForm(null, a => cb(a.id)); };
    });
}
function pickDate(ids) {
  const first = G.items.find(x => x.id === ids[0]);
  modal(`<h3>Aufnahmedatum ändern</h3><label class="f">Neues Datum und Uhrzeit für ${plural(ids.length, 'Objekt', 'Objekte')}</label>
    <input class="field" type="datetime-local" id="dt" value="${first ? first.t.replace(' ', 'T').slice(0, 16) : ''}">
    <div class="foot"><button class="pill" data-close>Abbrechen</button><button class="pill primary" id="ok">Datum ändern</button></div>`,
    (m, close) => $('#ok', m).onclick = async () => {
      const v = $('#dt', m).value; if (!v) return;
      try { await bulk('date', v, ids); close(); toast('Datum geändert'); route(); } catch (e) { toast(e.message); }
    });
}

/* ------------------------------------------------------------- Lightbox */
const LB = { i: 0, items: [], zoom: false };
function openLightbox(i) {
  LB.items = G.items; LB.i = i;
  $('#lightbox').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  renderLB();
}
function closeLB() {
  const v = $('#lb-stage video'); if (v) v.pause();
  $('#lightbox').classList.add('hidden'); $('#lb-info').classList.add('hidden');
  $('#lb-stage').innerHTML = ''; document.body.style.overflow = '';
}
function renderLB() {
  const it = LB.items[LB.i]; if (!it) return closeLB();
  const st = $('#lb-stage');
  LB.zoom = false; st.classList.remove('zoomed');
  st.innerHTML = it.k === 'v'
    ? `<video src="/api/media/${it.id}/view" controls playsinline autoplay poster="/api/media/${it.id}/thumb"></video>`
    : `<img src="/api/media/${it.id}/view" alt="">`;
  const img = $('img', st);
  if (img) img.ondblclick = img.onclick = e => { if (e.type === 'click' && !matchMedia('(hover: hover)').matches) return; LB.zoom = !LB.zoom; img.classList.toggle('zoom', LB.zoom); st.classList.toggle('zoomed', LB.zoom); };
  $('#lb-date').textContent = toDate(it.t).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
  $('#lb-time').textContent = toDate(it.t).toLocaleDateString('de-DE', { weekday: 'long' }) + ', ' + fmtTime(it.t);
  $('#lb-count').textContent = `${LB.i + 1}/${LB.items.length}`;
  $('[data-lb=fav]').innerHTML = it.f ? I.heartF : I.heart;
  $('[data-lb=delete]').innerHTML = G.opts.trash ? I.restore : I.trash;
  [LB.i - 1, LB.i + 1].forEach(k => { const n = LB.items[k]; if (n && n.k === 'i') new Image().src = `/api/media/${n.id}/view`; });
  if (!$('#lb-info').classList.contains('hidden')) renderInfo();
}
function lbStep(d) { const n = LB.i + d; if (n >= 0 && n < LB.items.length) { LB.i = n; renderLB(); } }
async function renderInfo() {
  const it = LB.items[LB.i], box = $('#lb-info');
  box.innerHTML = '…';
  try {
    const m = await api(`/api/media/${it.id}`);
    box.innerHTML = `<dl>
      <dt>Datei</dt><dd>${esc(m.filename)}</dd>
      <dt>Aufnahme</dt><dd>${esc(fmtDay(m.taken_at))}, ${fmtTime(m.taken_at)}</dd>
      <dt>Größe</dt><dd>${fmtBytes(m.size)}${m.width ? ` · ${m.width} × ${m.height}` : ''}${m.duration ? ` · ${fmtDur(Math.round(m.duration))}` : ''}</dd>
      <dt>Label</dt><dd><select id="lb-label"><option value="">Kein Label</option>${S.labels.map(l => `<option value="${l.id}" ${l.id === m.label_id ? 'selected' : ''}>${esc(l.name)}</option>`).join('')}</select></dd>
      <dt>Album</dt><dd>${m.album_id && S.albumMap[m.album_id] ? `<a href="#/sammlung/album/${m.album_id}" style="color:#4da3ff">${esc(S.albumMap[m.album_id].name)}</a>` : '–'}</dd>
      <dt>Ordner</dt><dd><code style="background:rgba(255,255,255,.1)">${esc(m.path)}</code></dd></dl>`;
    $('#lb-label').onchange = async e => {
      const lid = e.target.value ? +e.target.value : null;
      await bulk('label', lid, [it.id]); it.l = lid; refreshTile(it.id); loadLabels(); toast('Label gespeichert');
    };
    box.querySelector('a')?.addEventListener('click', closeLB);
  } catch (e) { box.textContent = e.message; }
}
function bindLightbox() {
  const lb = $('#lightbox');
  lb.querySelector('[data-lb=close]').innerHTML = I.close;
  lb.querySelector('[data-lb=prev]').innerHTML = I.back;
  lb.querySelector('[data-lb=next]').innerHTML = I.next;
  lb.querySelector('[data-lb=info]').innerHTML = I.info;
  lb.querySelector('[data-lb=download]').innerHTML = I.dl;
  lb.addEventListener('click', async e => {
    const b = e.target.closest('[data-lb]'); if (!b) return;
    const it = LB.items[LB.i];
    switch (b.dataset.lb) {
      case 'close': closeLB(); break;
      case 'prev': lbStep(-1); break;
      case 'next': lbStep(1); break;
      case 'info': $('#lb-info').classList.toggle('hidden'); if (!$('#lb-info').classList.contains('hidden')) renderInfo(); break;
      case 'download': location.href = `/api/media/${it.id}/original?dl=1`; break;
      case 'fav':
        it.f = it.f ? 0 : 1; await bulk('favorite', !!it.f, [it.id]);
        b.innerHTML = it.f ? I.heartF : I.heart; refreshTile(it.id); break;
      case 'delete': {
        const act = G.opts.trash ? 'restore' : 'trash';
        await bulk(act, null, [it.id]);
        toast(act === 'trash' ? 'In „Zuletzt gelöscht“ verschoben' : 'Wiederhergestellt');
        removeFromGrid([it.id]);
        LB.items = G.items;
        if (!LB.items.length) return closeLB();
        LB.i = Math.min(LB.i, LB.items.length - 1); renderLB(); break;
      }
    }
  });
  document.addEventListener('keydown', e => {
    if (lb.classList.contains('hidden') || e.target.matches('input, select')) return;
    if (e.key === 'Escape') closeLB();
    else if (e.key === 'ArrowLeft') lbStep(-1);
    else if (e.key === 'ArrowRight') lbStep(1);
    else if (e.key === ' ' || e.key.toLowerCase() === 'f') { e.preventDefault(); lb.querySelector('[data-lb=fav]').click(); }
  });
  let x0 = null, y0 = 0;
  const st = $('#lb-stage');
  st.addEventListener('touchstart', e => { if (e.touches.length === 1 && !LB.zoom) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; } else x0 = null; }, { passive: true });
  st.addEventListener('touchend', e => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) lbStep(dx < 0 ? 1 : -1);
    else if (dy > 110 && Math.abs(dy) > Math.abs(dx) && (visualViewport?.scale ?? 1) <= 1.01) closeLB();
    x0 = null;
  });
}

/* ------------------------------------------------------------- Seiten */
const view = () => $('#view');

async function pageMediathek(filter) {
  filter = filter || sessionStorage.getItem('mt-filter') || 'all';
  const seg = `<div class="seg" id="seg">${[['all', 'Alle'], ['image', 'Fotos'], ['video', 'Videos']].map(([k, l]) => `<button data-k="${k}" class="${k === filter ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  setHeader('Mediathek', { actions: gridActions() });
  bindGridActions();
  view().innerHTML = `<div style="padding:10px 16px 0">${seg}</div><div id="gridhost"></div>`;
  $('#seg').onclick = e => { const b = e.target.closest('[data-k]'); if (b) { try { sessionStorage.setItem('mt-filter', b.dataset.k); } catch { /* leer */ } pageMediathek(b.dataset.k); } };
  const q = new URLSearchParams({ order: S.settings.order });
  if (filter !== 'all') q.set('kind', filter);
  const { items } = await api('/api/media?' + q);
  const sub = `${plural(items.filter(x => x.k === 'i').length, 'Foto', 'Fotos')}, ${plural(items.filter(x => x.k === 'v').length, 'Video', 'Videos')}`;
  $('#subtitle').textContent = sub;
  mountGrid($('#gridhost'), items, { empty: '<strong>Noch keine Fotos</strong>Lade Fotos, Videos, Ordner oder ZIP-Dateien im Import hoch.<br><a class="pill primary" href="#/import">Zum Import</a>' });
}

async function pageSammlung() {
  setHeader('Sammlung');
  const [mem, ov] = await Promise.all([api('/api/memories'), api('/api/overview'), loadAlbums(), loadLabels()]);
  const today = new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long' });
  const memHtml = mem.length
    ? `<div class="memories">${mem.map(m => `<a class="mem" href="#/sammlung/rueckblick/${m.year}"><img src="/api/media/${m.cover}/thumb" alt=""><div class="cap"><b>${m.ago === 1 ? 'Vor einem Jahr' : `Vor ${m.ago} Jahren`}</b><span>${today} ${m.year} · ${plural(m.count, 'Objekt', 'Objekte')}</span></div></a>`).join('')}</div>`
    : `<div class="mem-empty">Am ${today} gibt es aus früheren Jahren noch keine Fotos.</div>`;
  const albumCard = a => `<a class="album" href="#/sammlung/album/${a.id}"><div class="cv">${a.cover ? `<img src="/api/media/${a.cover}/thumb" alt="" loading="lazy">` : I.folder}</div>
      <div class="nm">${esc(a.name)}</div><div class="mt">${fmtShort(a.date)}${a.label_id && S.labelMap[a.label_id] ? ` ${labelBadge(a.label_id, 'badge inline')} ${esc(S.labelMap[a.label_id].name)}` : ''} · ${a.count}</div></a>`;
  const row = (href, icon, label, count, small = '') => `<a class="row" href="${href}"><span class="ic">${icon}</span><span class="lbl">${esc(label)}${small ? `<small>${small}</small>` : ''}</span><span class="val">${count.toLocaleString('de-DE')}</span><span class="chev">${I.next}</span></a>`;
  view().innerHTML = `
    <section class="section"><h2>Rückblick</h2>${memHtml}</section>
    <section class="section"><h2>Alben <button id="newalbum">Neues Album</button></h2>
      <div class="albums">
        <a class="album" href="#/sammlung/favoriten"><div class="cv">${ov.favorites.cover ? `<img src="/api/media/${ov.favorites.cover}/thumb" alt="">` : ''}<span class="ov">${I.heartF}</span></div><div class="nm">Favoriten</div><div class="mt">${ov.favorites.count}</div></a>
        ${S.albums.map(albumCard).join('')}
        <button class="album new" id="newalbum2"><div class="cv">${I.plus}</div><div class="nm">Neues Album</div><div class="mt">Datum, Label, Name</div></button>
      </div></section>
    <section class="section"><h2>Medienarten</h2><div class="list">
      ${row('#/sammlung/typ/image', I.image, 'Fotos', ov.images.count)}
      ${row('#/sammlung/typ/video', I.video, 'Videos', ov.videos.count)}
      ${row('#/sammlung/typ/screenshots', I.phone, 'Bildschirmfotos', ov.screenshots.count)}
    </div></section>
    <section class="section"><h2>Labels <a href="#/einstellungen">Bearbeiten</a></h2><div class="list">
      ${S.labels.map(l => `<a class="row" href="#/sammlung/label/${l.id}">${logoPrev(l)}<span class="lbl">${esc(l.name)}</span><span class="val">${l.count.toLocaleString('de-DE')}</span><span class="chev">${I.next}</span></a>`).join('')}
      ${row('#/sammlung/label/0', I.notag, 'Ohne Label', ov.unlabeled.count)}
    </div></section>
    <section class="section"><h2>Weitere</h2><div class="list">
      ${row('#/sammlung/papierkorb', I.trash, 'Zuletzt gelöscht', ov.trash, `Wird nach ${S.settings.trash_days} Tagen endgültig gelöscht`)}
    </div></section>`;
  const nw = () => albumForm(null, a => { location.hash = `#/sammlung/album/${a.id}`; });
  $('#newalbum').onclick = nw; $('#newalbum2').onclick = nw;
}

async function pageFiltered(title, query, opts, subtitle = '', extraActions = '') {
  setHeader(title, { back: '#/sammlung', subtitle, actions: gridActions(extraActions) });
  bindGridActions();
  view().innerHTML = '<div id="gridhost"></div>';
  const q = new URLSearchParams({ order: S.settings.order, ...query });
  const { items } = await api('/api/media?' + q);
  mountGrid($('#gridhost'), items, opts);
  return items;
}

async function pageAlbum(aid) {
  await Promise.all([loadAlbums(), loadLabels()]);
  const a = S.albumMap[aid];
  if (!a) { location.hash = '#/sammlung'; return; }
  const sub = `${esc(fmtShort(a.date))}${a.label_id && S.labelMap[a.label_id] ? ` · ${labelBadge(a.label_id, 'badge inline')} ${esc(S.labelMap[a.label_id].name)}` : ''} · ${plural(a.count, 'Objekt', 'Objekte')}`;
  await pageFiltered(a.name, { album: aid }, { album: aid, group: 'day', empty: '<strong>Album ist leer</strong>Wähle in der Mediathek Fotos aus und verschiebe sie hierher – oder importiere direkt in dieses Album.' },
    sub, `<button class="icon-btn" id="albmore" title="Album-Optionen">${I.more}</button>`);
  $('#albmore').onclick = () => sheet(a.name, [
    { label: 'Album bearbeiten', icon: I.folder, run: () => albumForm(a, () => route()) },
    { label: 'In dieses Album importieren', icon: I.imp, run: () => { sessionStorage.setItem('imp-album', aid); location.hash = '#/import'; } },
    { label: 'Album als ZIP herunterladen', icon: I.dl, run: () => G.items.length && downloadZip(G.items.map(x => x.id)) },
    { label: 'Album löschen', icon: I.trash, danger: true, run: async () => {
      if (!await confirmBox('Album löschen?', 'Die Fotos und Videos bleiben in der Mediathek erhalten; nur das Album und sein Ordner werden entfernt.', 'Album löschen')) return;
      await api(`/api/albums/${aid}`, { method: 'DELETE' }); toast('Album gelöscht'); location.hash = '#/sammlung';
    } },
  ]);
}

function albumForm(a, done) {
  const today = new Date().toISOString().slice(0, 10);
  modal(`<h3>${a ? 'Album bearbeiten' : 'Neues Album'}</h3>
    <label class="f" for="an">Name</label><input class="field" id="an" value="${esc(a?.name || '')}" placeholder="z. B. Konzert 3">
    <label class="f" for="ad">Datum</label><input class="field" type="date" id="ad" value="${a?.date || today}">
    <label class="f" for="al">Label</label><select class="field" id="al"><option value="">Kein Label</option>${S.labels.map(l => `<option value="${l.id}" ${a?.label_id === l.id ? 'selected' : ''}>${esc(l.name)}</option>`).join('')}</select>
    <div class="folder-prev">Ordner: <code id="fp"></code></div>
    <div class="foot"><button class="pill" data-close>Abbrechen</button><button class="pill primary" id="ok">${a ? 'Speichern' : 'Album erstellen'}</button></div>`,
    (m, close) => {
      const upd = () => { const l = S.labelMap[$('#al', m).value]; $('#fp', m).textContent = ['Alben/' + $('#ad', m).value, l?.name, $('#an', m).value.trim() || '…'].filter(Boolean).join(' '); };
      m.addEventListener('input', upd); upd();
      $('#ok', m).onclick = async () => {
        const body = { name: $('#an', m).value.trim(), date: $('#ad', m).value, label_id: $('#al', m).value || null };
        try {
          const res = await api(a ? `/api/albums/${a.id}` : '/api/albums', { method: a ? 'PATCH' : 'POST', body });
          await loadAlbums(); close(); toast(a ? 'Album gespeichert' : 'Album erstellt'); done && done(res);
        } catch (e) { toast(e.message); }
      };
    });
}

/* ------------------------------------------------------------- Import */
const MEDIA_RX = /\.(jpe?g|png|gif|webp|heic|heif|bmp|tiff?|avif|mp4|mov|m4v|avi|mkv|webm|3gp|mts|zip)$/i;
const IMP = { label: null, album: null, busy: false };

async function pageImport() {
  setHeader('Import');
  await Promise.all([loadLabels(), loadAlbums()]);
  const pre = sessionStorage.getItem('imp-album');
  if (pre) { IMP.album = +pre; sessionStorage.removeItem('imp-album'); }
  if (IMP.label && !S.labelMap[IMP.label]) IMP.label = null;
  view().innerHTML = `<div class="wrap">
    <div class="step"><h3>Import-Label</h3><p>Woher stammen die Fotos? Das Label erscheint als kleines Logo unten rechts in der Übersicht.</p>
      <div class="chips" id="chips"></div></div>
    <div class="step"><h3>Ziel</h3><p>Neue Objekte landen in der Mediathek – optional direkt in einem Album.</p>
      <select class="field" id="target"><option value="">Nur Mediathek</option>${S.albums.map(a => `<option value="${a.id}" ${IMP.album === a.id ? 'selected' : ''}>${esc(a.folder)}</option>`).join('')}<option value="new">Neues Album …</option></select></div>
    <div class="step"><div class="drop" id="drop"><b>Dateien hierher ziehen</b><span style="color:var(--fg2)">Fotos, Videos, ganze Ordner oder ZIP-Dateien</span>
      <div class="btns"><button class="pill primary" id="bf">Fotos & Videos</button><button class="pill" id="bd">Ordner</button><button class="pill" id="bz">ZIP-Datei</button></div></div>
      <input type="file" id="ff" multiple accept="image/*,video/*,.heic,.heif,.zip" hidden>
      <input type="file" id="fd" webkitdirectory multiple hidden>
      <input type="file" id="fz" accept=".zip,application/zip" multiple hidden></div>
    <div class="step" id="status"></div></div>`;
  renderChips();
  $('#target').onchange = e => {
    if (e.target.value === 'new') albumForm(null, a => { IMP.album = a.id; pageImport(); });
    else IMP.album = e.target.value ? +e.target.value : null;
  };
  $('#bf').onclick = () => $('#ff').click(); $('#bd').onclick = () => $('#fd').click(); $('#bz').onclick = () => $('#fz').click();
  ['ff', 'fd', 'fz'].forEach(id => $('#' + id).onchange = e => { startImport([...e.target.files]); e.target.value = ''; });
  const drop = $('#drop');
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', async e => {
    e.preventDefault(); drop.classList.remove('over');
    const entries = [...e.dataTransfer.items].map(i => i.webkitGetAsEntry && i.webkitGetAsEntry()).filter(Boolean);
    startImport(entries.length ? await filesFromEntries(entries) : [...e.dataTransfer.files]);
  });
}
function renderChips() {
  $('#chips').innerHTML = `<button class="chip none ${IMP.label == null ? 'on' : ''}" data-id="">Kein Label</button>` +
    S.labels.map(l => `<button class="chip ${IMP.label === l.id ? 'on' : ''}" data-id="${l.id}">${logoPrev(l)}${esc(l.name)}</button>`).join('') +
    `<a class="chip none" href="#/einstellungen">${I.plus.replace('class="ico"', 'class="ico" style="width:16px;height:16px"')} Label</a>`;
  $('#chips').querySelectorAll('button').forEach(b => b.onclick = () => { IMP.label = b.dataset.id ? +b.dataset.id : null; renderChips(); });
}
async function filesFromEntries(entries) {
  const out = [];
  const walk = async en => {
    if (en.isFile) out.push(await new Promise((res, rej) => en.file(res, rej)));
    else if (en.isDirectory) {
      const rd = en.createReader();
      let batch;
      do { batch = await new Promise((res, rej) => rd.readEntries(res, rej)); for (const c of batch) await walk(c); } while (batch.length);
    }
  };
  for (const en of entries) await walk(en);
  return out;
}
function uploadBatch(batch, onProgress) {
  return new Promise((res, rej) => {
    const fd = new FormData();
    batch.forEach(f => fd.append('files', f, f.name));
    fd.append('mtimes', JSON.stringify(batch.map(f => f.lastModified || 0)));
    fd.append('label_id', IMP.label || '');
    fd.append('album_id', IMP.album || '');
    const x = new XMLHttpRequest();
    x.open('POST', '/api/import');
    x.upload.onprogress = e => onProgress(e.loaded);
    x.onload = () => x.status < 300 ? res(JSON.parse(x.responseText)) : rej(new Error(`Server meldet ${x.status}`));
    x.onerror = () => rej(new Error('Verbindung zum Server unterbrochen'));
    x.send(fd);
  });
}
async function startImport(all) {
  if (IMP.busy) return toast('Ein Import läuft bereits');
  const files = all.filter(f => MEDIA_RX.test(f.name) && !f.name.startsWith('.'));
  const ignored = all.length - files.length;
  if (!files.length) return toast('Keine Fotos, Videos oder ZIP-Dateien gefunden');
  IMP.busy = true;
  const batches = []; let cur = [], curSize = 0;
  for (const f of files) {
    if (/\.zip$/i.test(f.name)) { batches.push([f]); continue; }
    if (cur.length >= 25 || curSize + f.size > 300 * 1024 * 1024) { batches.push(cur); cur = []; curSize = 0; }
    cur.push(f); curSize += f.size;
  }
  if (cur.length) batches.push(cur);
  const total = files.reduce((s, f) => s + f.size, 0) || 1;
  let done = 0;
  const sum = { imported: 0, duplicate: 0, skipped: ignored, error: 0, errors: [] };
  const st = $('#status');
  const label = IMP.label ? S.labelMap[IMP.label]?.name : null;
  st.innerHTML = `<h3>Wird importiert …</h3><div class="progress"><div id="pb"></div></div><div id="pt" style="color:var(--fg2);font-size:14px"></div>`;
  for (const [n, b] of batches.entries()) {
    const bs = b.reduce((s, f) => s + f.size, 0);
    try {
      const r = await uploadBatch(b, loaded => {
        const pct = Math.min(100, (done + loaded) / total * 100);
        $('#pb') && ($('#pb').style.width = pct + '%');
        $('#pt') && ($('#pt').textContent = loaded >= bs ? `Verarbeite Paket ${n + 1} von ${batches.length} …` : `${fmtBytes(done + loaded)} von ${fmtBytes(total)} hochgeladen`);
      });
      for (const k of ['imported', 'duplicate', 'skipped', 'error']) sum[k] += r[k];
      sum.errors.push(...r.errors);
    } catch (e) { sum.error += b.length; sum.errors.push(e.message); }
    done += bs;
  }
  IMP.busy = false;
  st.innerHTML = `<div class="result"><strong>${plural(sum.imported, 'Objekt', 'Objekte')} importiert</strong>${label ? ` mit Label „${esc(label)}“` : ''}${IMP.album && S.albumMap[IMP.album] ? ` in „${esc(S.albumMap[IMP.album].name)}“` : ''}.
    ${sum.duplicate ? `<br>${plural(sum.duplicate, 'Duplikat', 'Duplikate')} übersprungen.` : ''}${sum.skipped ? `<br>${plural(sum.skipped, 'Datei', 'Dateien')} ohne unterstütztes Format ignoriert.` : ''}
    ${sum.errors.length ? `<ul>${sum.errors.slice(0, 10).map(e => `<li>${esc(e)}</li>`).join('')}</ul>` : ''}
    <div style="margin-top:12px"><a class="pill primary" href="${IMP.album ? '#/sammlung/album/' + IMP.album : '#/mediathek'}">Ansehen</a></div></div>`;
}

/* ------------------------------------------------------------- Einstellungen */
async function pageSettings() {
  setHeader('Einstellungen');
  const [info] = await Promise.all([api('/api/info'), loadLabels()]);
  view().innerHTML = `<div class="wrap">
    <div class="step"><h3>Import-Labels</h3><div class="list">
      ${S.labels.map(l => `<button class="row" data-label="${l.id}">${logoPrev(l)}<span class="lbl">${esc(l.name)}<small>${plural(l.count, 'Objekt', 'Objekte')}${l.show_badge ? '' : ' · Logo ausgeblendet'}</small></span><span class="chev">${I.next}</span></button>`).join('')}
      <button class="row" id="newlabel"><span class="ic">${I.plus}</span><span class="lbl" style="color:var(--accent)">Neues Label</span></button></div>
      <div class="hint">Logos werden quadratisch angezeigt – am besten PNG oder SVG mit transparentem Hintergrund.</div></div>
    <div class="step"><h3>Darstellung</h3><div class="list">
      <div class="form-row"><span>Sortierung</span><select class="field" id="order" style="width:auto"><option value="desc">Neueste zuerst</option><option value="asc">Älteste zuerst</option></select></div>
      <div class="form-row"><label for="tile">Kachelgröße</label><input type="range" id="tile" min="56" max="240" step="2" value="${S.settings.tile}"></div>
      <div class="form-row"><label for="badges">Label-Logos in der Übersicht</label><input type="checkbox" class="switch" id="badges" ${S.settings.badges ? 'checked' : ''}></div>
    </div></div>
    <div class="step"><h3>Bibliothek</h3><div class="list">
      <div class="form-row"><span>Inhalt</span><span class="val" style="color:var(--fg2)">${plural(info.images, 'Foto', 'Fotos')}, ${plural(info.videos, 'Video', 'Videos')} · ${fmtBytes(info.size)}</span></div>
      <div class="form-row"><span>Freier Speicher</span><span style="color:var(--fg2)">${fmtBytes(info.disk_free)} von ${fmtBytes(info.disk_total)}</span></div>
      <div class="form-row"><label for="trash">„Zuletzt gelöscht“ aufbewahren (Tage)</label><input type="number" id="trash" min="1" max="365" value="${S.settings.trash_days}"></div>
      <div class="form-row"><span>Ordner nach Dateien durchsuchen<small style="display:block;color:var(--fg2);font-size:13px" id="scanst">Findet Dateien, die direkt in den Galerie-Ordner kopiert wurden.</small></span><button class="pill" id="scan">Scannen</button></div>
    </div>
    <div class="hint">Medien: <code>${esc(info.media_path)}</code><br>App-Daten: <code>${esc(info.data_path)}</code><br>Beide Ordner liegen außerhalb der App – Updates und Neuinstallationen behalten alle Fotos, Alben und Labels.</div></div>
    <div class="step"><h3>Über</h3><div class="list"><div class="form-row"><span>Galerie für ZimaOS</span><span style="color:var(--fg2)">Version ${esc(info.version)}</span></div></div></div></div>`;
  $('#order').value = S.settings.order;
  $('#order').onchange = e => saveSettings({ order: e.target.value }).then(() => toast('Gespeichert'));
  $('#tile').oninput = e => document.documentElement.style.setProperty('--tile', e.target.value + 'px');
  $('#tile').onchange = e => saveSettings({ tile: +e.target.value });
  $('#badges').onchange = e => saveSettings({ badges: e.target.checked });
  $('#trash').onchange = e => saveSettings({ trash_days: Math.max(1, +e.target.value || 30) }).then(() => toast('Gespeichert'));
  $('#newlabel').onclick = () => labelForm(null);
  view().querySelectorAll('[data-label]').forEach(b => b.onclick = () => labelForm(S.labelMap[+b.dataset.label]));
  $('#scan').onclick = async () => { await api('/api/scan', { method: 'POST' }); pollScan(); };
  const s = await api('/api/scan'); if (s.running) pollScan();
}
async function pollScan() {
  const s = await api('/api/scan'), el = $('#scanst'), btn = $('#scan');
  if (!el) return;
  btn.disabled = s.running;
  el.textContent = s.running ? `Läuft … ${s.added} neu, ${s.removed} entfernt` : (s.finished ? `Zuletzt ${s.finished}: ${s.added} neu, ${s.removed} entfernt, ${s.albums} Alben erkannt${s.error ? ' – Fehler: ' + s.error : ''}` : el.textContent);
  if (s.running) setTimeout(pollScan, 1500);
}
function labelForm(l) {
  modal(`<h3>${l ? 'Label bearbeiten' : 'Neues Label'}</h3>
    <label class="f" for="ln">Name</label><input class="field" id="ln" value="${esc(l?.name || '')}" placeholder="z. B. Snapchat">
    <label class="f" for="lc">Farbe (wenn kein Logo hochgeladen ist)</label><input class="field" type="color" id="lc" value="${esc(l?.color || '#8e8e93')}" style="height:46px;padding:4px">
    ${l ? `<label class="f">Logo</label><div style="display:flex;align-items:center;gap:12px">${logoPrev(l).replace('logo-prev', 'logo-prev" style="width:48px;height:48px')}
      <button class="pill" id="lu">Logo hochladen</button>${l.logo_url ? '<button class="pill danger" id="lr">Entfernen</button>' : ''}<input type="file" id="lf" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif" hidden></div>` : '<div class="hint" style="padding:8px 0 0">Ein Logo kannst du nach dem Anlegen hochladen.</div>'}
    <div class="form-row" style="padding:14px 0 0"><label for="lb">Logo in der Übersicht anzeigen</label><input type="checkbox" class="switch" id="lb" ${l?.show_badge === 0 ? '' : 'checked'}></div>
    <div class="foot">${l ? '<button class="pill danger" id="ldel">Löschen</button>' : ''}<span class="spacer"></span><button class="pill" data-close>Abbrechen</button><button class="pill primary" id="ok">${l ? 'Speichern' : 'Label anlegen'}</button></div>`,
    (m, close) => {
      $('#ok', m).onclick = async () => {
        const body = { name: $('#ln', m).value.trim(), color: $('#lc', m).value, show_badge: $('#lb', m).checked };
        try {
          const res = await api(l ? `/api/labels/${l.id}` : '/api/labels', { method: l ? 'PATCH' : 'POST', body });
          close(); toast(l ? 'Label gespeichert' : 'Label angelegt');
          await pageSettings();
          if (!l) labelForm(S.labelMap[res.id]);
        } catch (e) { toast(e.message); }
      };
      if (!l) return;
      $('#lu', m).onclick = () => $('#lf', m).click();
      $('#lf', m).onchange = async e => {
        const fd = new FormData(); fd.append('file', e.target.files[0]);
        try { await api(`/api/labels/${l.id}/logo`, { method: 'POST', body: fd }); close(); toast('Logo gespeichert'); await pageSettings(); labelForm(S.labelMap[l.id]); } catch (err) { toast(err.message); }
      };
      $('#lr', m) && ($('#lr', m).onclick = async () => { await api(`/api/labels/${l.id}/logo`, { method: 'DELETE' }); close(); await pageSettings(); labelForm(S.labelMap[l.id]); });
      $('#ldel', m).onclick = async () => {
        close();
        if (!await confirmBox(`Label „${l.name}“ löschen?`, 'Die Fotos bleiben erhalten, verlieren aber dieses Label. Alben mit diesem Label werden umbenannt.')) return;
        await api(`/api/labels/${l.id}`, { method: 'DELETE' }); toast('Label gelöscht'); pageSettings();
      };
    });
}

/* ------------------------------------------------------------- Router */
async function route() {
  closeLB();
  document.querySelectorAll('.modal-bg').forEach(m => m.remove());
  const parts = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  const tab = ['mediathek', 'sammlung', 'import', 'einstellungen'].includes(parts[0]) ? parts[0] : 'mediathek';
  document.querySelectorAll('.tabbar a').forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
  setSelecting(false, true);
  G.opts = {};
  scrollTo(0, 0);
  try {
    if (tab === 'mediathek') return await pageMediathek();
    if (tab === 'import') return await pageImport();
    if (tab === 'einstellungen') return await pageSettings();
    const [, sub, arg] = parts;
    if (!sub) return await pageSammlung();
    if (sub === 'album') return await pageAlbum(+arg);
    if (sub === 'favoriten') return await pageFiltered('Favoriten', { favorite: 1 }, { favorites: true, empty: '<strong>Noch keine Favoriten</strong>Tippe beim Ansehen eines Fotos auf das Herz.' });
    if (sub === 'papierkorb') return await pageFiltered('Zuletzt gelöscht', { trash: 1 }, { trash: true, group: 'none', empty: '<strong>Nichts gelöscht</strong>Gelöschte Objekte bleiben hier eine Weile, bevor sie endgültig entfernt werden.' }, `Objekte werden nach ${S.settings.trash_days} Tagen endgültig gelöscht`);
    if (sub === 'typ') {
      const map = { image: ['Fotos', { kind: 'image' }], video: ['Videos', { kind: 'video' }], screenshots: ['Bildschirmfotos', { screenshots: 1 }] };
      const [t, q] = map[arg] || map.image;
      return await pageFiltered(t, q, {});
    }
    if (sub === 'label') {
      const lid = +arg, l = S.labelMap[lid];
      return await pageFiltered(lid ? (l?.name || 'Label') : 'Ohne Label', { label: lid }, { labelFilter: lid }, lid && l ? `${labelBadge(lid, 'badge inline')} ${plural(l.count, 'Objekt', 'Objekte')}` : '');
    }
    if (sub === 'rueckblick') {
      const today = new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long' });
      return await pageFiltered(`${today} ${arg}`, { onthisday: 1, year: arg, order: 'asc' }, { group: 'none' }, `Vor ${new Date().getFullYear() - +arg} Jahr${new Date().getFullYear() - +arg === 1 ? '' : 'en'}`);
    }
    location.hash = '#/sammlung';
  } catch (e) {
    view().innerHTML = `<div class="empty"><strong>Laden fehlgeschlagen</strong>${esc(e.message)}<br><button class="pill primary" onclick="route()">Erneut versuchen</button></div>`;
  }
}

/* ------------------------------------------------------------- Start */
(async function init() {
  document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = I[el.dataset.icon]; });
  $('#back').innerHTML = I.back;
  bindLightbox();
  try { S.settings = await api('/api/settings'); } catch { /* Standardwerte */ }
  applySettings();
  await Promise.all([loadLabels(), loadAlbums()]).catch(() => {});
  window.addEventListener('hashchange', route);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && G.selecting && $('#lightbox').classList.contains('hidden')) setSelecting(false); });
  route();
})();
