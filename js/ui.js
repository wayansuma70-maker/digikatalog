// ============================================================
// UI — state bersama, helper, ikon, toast, modal
// ============================================================
(function () {
  const DK = window.DK = window.DK || {};

  // ---------- State ----------
  Object.assign(DK.S, {
    pub: null, pubError: '', q: '', cat: 'Semua', sort: 'terbaru', tab: 'fitur', pendingScroll: null,
    ov: null, msgs: [], msgFilter: 'Semua', msgQ: '', msgPage: 1, series: 'harian',
    prods: [], prodFilter: 'Semua', prodCat: '', prodQ: '', settings: null, connected: null
  });

  // ---------- Helper ----------
  DK.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  DK.rupiah = function (n) { return 'Rp ' + new Intl.NumberFormat('id-ID').format(Number(n) || 0); };
  DK.safeUrl = function (u) { return /^https?:\/\//i.test(u || '') ? u : ''; };
  DK.debounce = function (fn, ms) {
    let t; return function () { const a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms); };
  };
  DK.ago = function (iso) {
    const d = new Date(iso);
    if (isNaN(d)) return '-';
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return 'Baru saja';
    const m = Math.floor(s / 60); if (m < 60) return m + ' menit lalu';
    const h = Math.floor(m / 60); if (h < 24) return h + ' jam lalu';
    const dd = Math.floor(h / 24); if (dd < 7) return dd + ' hari lalu';
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  DK.bytes = function (n) {
    n = Number(n) || 0;
    if (n >= 1073741824) return (n / 1073741824).toFixed(1) + ' GB';
    if (n >= 1048576) return (n / 1048576).toFixed(1) + ' MB';
    return Math.round(n / 1024) + ' KB';
  };
  DK.waLink = function (num, text) {
    const n = String(num || '').replace(/\D/g, '');
    return n ? 'https://wa.me/' + n + '?text=' + encodeURIComponent(text || '') : '';
  };
  DK.hue = function (str) {
    let h = 0; String(str || 'x').split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) % 360; });
    return h;
  };

  // ---------- Ikon (garis, 24x24) ----------
  const P = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
    box: '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/>',
    sync: '<path d="M21 12a9 9 0 00-15-6.7L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0015 6.7L21 16"/><path d="M16 16h5v5"/>',
    settings: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    store: '<path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v11h16V9"/><path d="M3 9c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3"/>',
    bell: '<path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 6L2 7"/>',
    chat: '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>',
    external: '<path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><path d="M15 3h6v6M10 14L21 3"/>',
    cart: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 002 1.6h9.7a2 2 0 002-1.6L23 6H6"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    bolt: '<path d="M13 2L3 14h9l-1 8 10-12h-9z"/>',
    folder: '<path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>',
    refresh: '<path d="M21 12a9 9 0 11-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',
    x: '<path d="M18 6L6 18M6 6l12 12"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
    send: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',
    file: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
    logout: '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>',
    layers: '<path d="M12 2l10 5-10 5L2 7z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>',
    cloud: '<path d="M17.5 19a4.5 4.5 0 100-9h-1.8A7 7 0 104 14.9"/><path d="M12 12v9M9 18l3 3 3-3"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>'
  };
  DK.ic = function (name, size) {
    size = size || 18;
    return '<svg class="ic" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[name] || '') + '</svg>';
  };
  DK.logo = function (size) {
    size = size || 36;
    return '<svg class="logo" width="' + size + '" height="' + size + '" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="16" fill="#4648d4"/><rect x="14" y="20" width="36" height="10" rx="3" fill="#fff"/><rect x="14" y="36" width="18" height="9" rx="3" fill="#06b6d4"/><rect x="36" y="36" width="14" height="9" rx="3" fill="#fea619"/></svg>';
  };

  // ---------- Toast ----------
  DK.toast = function (msg, type) {
    const root = document.getElementById('toast-root');
    const el = document.createElement('div');
    el.className = 'toast toast-' + (type || 'ok');
    el.innerHTML = DK.ic(type === 'error' ? 'x' : 'checkCircle', 18) + '<span>' + DK.esc(msg) + '</span>';
    root.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('show'); });
    setTimeout(function () { el.classList.remove('show'); setTimeout(function () { el.remove(); }, 300); }, 3800);
  };

  // ---------- Modal ----------
  DK.openModal = function (html, wide) {
    document.getElementById('modal-root').innerHTML =
      '<div class="modal-back"><div class="modal' + (wide ? ' modal-wide' : '') + '" role="dialog" aria-modal="true">' + html + '</div></div>';
    document.body.classList.add('no-scroll');
  };
  DK.closeModal = function () {
    document.getElementById('modal-root').innerHTML = '';
    document.body.classList.remove('no-scroll');
  };

  // ---------- Gambar produk (foto Drive atau placeholder berwarna) ----------
  DK.placeholder = function (p, cls) {
    const h = DK.hue(p && p.kategori);
    return '<div class="ph ' + (cls || '') + '" style="--h:' + h + '">' + DK.ic('image', 40) + '<span>' + DK.esc((p && p.nama) || '') + '</span></div>';
  };
  DK.thumb = function (p, cls) {
    const u = DK.safeUrl(p && p.foto);
    if (!u) return DK.placeholder(p, cls);
    return '<img class="pimg ' + (cls || '') + '" src="' + DK.esc(u) + '" alt="' + DK.esc(p.nama) + '" loading="lazy" referrerpolicy="no-referrer" data-fallback="1">';
  };
  // Jika gambar gagal dimuat, ganti dengan placeholder
  document.addEventListener('error', function (e) {
    const t = e.target;
    if (t && t.tagName === 'IMG' && t.dataset.fallback) {
      const holder = document.createElement('div');
      holder.innerHTML = DK.placeholder({ nama: t.alt, kategori: t.alt }, t.className.replace('pimg', '').trim());
      t.replaceWith(holder.firstChild);
    }
  }, true);
})();
