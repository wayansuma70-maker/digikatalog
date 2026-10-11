// ============================================================
// ADMIN — login, dasbor, katalog & berkas, pesan, sync, pengaturan
// ============================================================
(function () {
  const DK = window.DK = window.DK || {};
  const S = DK.S, esc = DK.esc, ic = DK.ic, rupiah = DK.rupiah, Api = DK.Api;
  const enc = encodeURIComponent;
  const COLORS = ['#4648d4', '#006577', '#fea619', '#10b981', '#ec4899', '#8b5cf6', '#64748b'];
  const NAV = [
    ['', 'grid', 'Ringkasan & Metrik'], ['produk', 'box', 'Katalog & Berkas'], ['pesan', 'inbox', 'Pesanan & Leads'],
    ['sync', 'sync', 'Google Sheets Sync'], ['pengaturan', 'settings', 'Pengaturan Web']
  ];
  let current = null;                 // kunci halaman admin yang aktif
  let pending = { foto: null, file: null };
  S.msgSize = 5;

  const site = function () { return Object.assign({}, DK.siteSettings(), S.settings || {}); };
  const app = function () { return document.getElementById('app'); };

  // ---------- Login ----------
  function renderLogin() {
    current = null;
    app().innerHTML =
      '<div class="login-wrap"><form class="card login" data-form="login">' + DK.logo(52) +
      '<h1>Admin Console</h1><p class="muted">Masuk untuk mengelola produk dan pesan masuk.</p>' +
      '<label class="field"><span>Password</span><div class="inp">' + ic('lock', 18) +
      '<input type="password" name="password" required autocomplete="current-password" autofocus placeholder="Masukkan password admin"></div></label>' +
      '<div class="form-msg" role="status"></div>' +
      '<button class="btn btn-primary btn-lg block" type="submit">Masuk</button>' +
      '<a class="center small link mt16 block" href="#/">← Kembali ke toko</a></form></div>';
  }

  DK.submitLogin = async function (form) {
    const btn = form.querySelector('button[type=submit]'), msg = form.querySelector('.form-msg');
    btn.disabled = true; btn.textContent = 'Memeriksa...'; msg.textContent = ''; msg.className = 'form-msg';
    try {
      const j = await Api.post('login', { password: form.elements.password.value });
      Api.setToken(j.data.token); S.connected = true;
      DK.route();
    } catch (e) {
      msg.className = 'form-msg error'; msg.textContent = e.message;
      btn.disabled = false; btn.textContent = 'Masuk';
    }
  };

  // ---------- Kerangka admin ----------
  function shell(active, inner) {
    const s = site(), baru = S.ov ? S.ov.stats.pesanBaru : 0;
    const nav = NAV.map(function (n) {
      return '<a class="snav' + (n[0] === active ? ' on' : '') + '" href="#/admin' + (n[0] ? '/' + n[0] : '') + '">' + ic(n[1], 20) + '<span>' + n[2] + '</span>' +
        (n[0] === 'pesan' && baru ? '<em class="count">' + baru + '</em>' : '') + '</a>';
    }).join('');
    return '<div class="admin"><aside class="sidebar" id="sidebar">' +
      '<div class="side-brand">' + DK.logo(40) + '<div><b>' + esc(s.NAMA_SITUS) + '</b><small>ADMIN CONSOLE</small></div></div>' +
      '<nav class="side-nav">' + nav + '</nav>' +
      '<div class="side-foot"><a class="snav" href="#/">' + ic('store', 20) + '<span>Buka Toko Publik</span></a>' +
      '<button class="snav" data-action="logout">' + ic('logout', 20) + '<span>Keluar</span></button></div></aside>' +
      '<div class="side-scrim" data-action="toggle-sidebar"></div>' +
      '<div class="admin-main"><header class="admin-top"><button class="icon-btn only-sm" data-action="toggle-sidebar" aria-label="Menu">' + ic('menu', 20) + '</button>' +
      '<span class="conn' + (S.connected === false ? ' bad' : '') + '"><i class="dot"></i> Koneksi GAS: ' + (S.connected === false ? 'Terputus' : 'Terhubung') + '</span><div class="grow"></div>' +
      '<a class="icon-btn" href="#/admin/pesan" aria-label="Pesan baru">' + ic('bell', 20) + (baru ? '<i class="ping"></i>' : '') + '</a>' +
      '<div class="me"><span class="avatar">A</span><div class="hide-sm"><b>Admin ' + esc(s.NAMA_SITUS) + '</b><small>Pemilik</small></div></div></header>' +
      '<div id="admin-main" class="admin-content">' + inner + '</div></div></div>';
  }

  function skeletonAdmin() {
    return '<div class="skel-line w40 big"></div><div class="grid4 mt16">' + '<div class="card pad skel-box"></div>'.repeat(4) + '</div><div class="card pad skel-box tall mt16"></div>';
  }

  function repaint() {
    const m = document.getElementById('admin-main');
    if (m && current !== null && PAGES[current]) { m.innerHTML = PAGES[current].html(); if (PAGES[current].after) PAGES[current].after(); }
    const badge = document.querySelector('.snav .count');
    if (S.ov && badge) { const n = S.ov.stats.pesanBaru; badge.textContent = n; badge.style.display = n ? '' : 'none'; }
  }

  function handleErr(e) {
    if (e.code === 'AUTH') { DK.toast('Sesi berakhir, silakan login ulang.', 'error'); renderLogin(); return true; }
    DK.toast(e.message, 'error'); return false;
  }

  DK.renderAdmin = async function (sub) {
    const rid = DK.routeId;
    if (!Api.token()) return renderLogin();
    if (!PAGES.hasOwnProperty(sub)) { location.hash = '#/admin'; return; }
    current = sub;
    app().innerHTML = shell(sub, skeletonAdmin());
    try {
      await PAGES[sub].load();
      S.connected = true;
    } catch (e) {
      if (rid !== DK.routeId) return;
      if (e.code === 'AUTH') return handleErr(e);
      S.connected = false;
      app().innerHTML = shell(sub, '<div class="card pad center"><h2>Gagal memuat data</h2><p class="muted mt8">' + esc(e.message) +
        '</p><button class="btn btn-primary mt16" data-action="retry-admin">' + ic('refresh', 16) + ' Coba lagi</button></div>');
      return;
    }
    if (rid !== DK.routeId) return;
    app().innerHTML = shell(sub, PAGES[sub].html());
    if (PAGES[sub].after) PAGES[sub].after();
  };

  // ---------- Komponen kecil ----------
  function metric(label, value, unit, sub, icon, tone) {
    return '<div class="card metric"><div class="m-top"><div><small>' + label + '</small><div class="m-val">' + value + (unit ? ' <span>' + unit + '</span>' : '') + '</div></div>' +
      '<div class="m-ic ' + tone + '">' + ic(icon, 22) + '</div></div><div class="m-sub">' + sub + '</div></div>';
  }
  function statusBadge(s) {
    const cls = { Baru: 'st-new', Dibaca: 'st-read', Selesai: 'st-done', Aktif: 'st-ok', Nonaktif: 'st-off' }[s] || 'st-off';
    return '<span class="status ' + cls + '"><i></i>' + esc(s) + '</span>';
  }

  // ---------- Dasbor ----------
  function donut(kat, total) {
    const R = 60, C = 2 * Math.PI * R; let off = 0;
    const segs = kat.map(function (k, i) {
      const len = total ? (k.jumlah / total) * C : 0;
      const el = '<circle r="' + R + '" cx="80" cy="80" fill="none" stroke="' + COLORS[i % COLORS.length] + '" stroke-width="22" stroke-dasharray="' + len + ' ' + (C - len) + '" stroke-dashoffset="' + (-off) + '" transform="rotate(-90 80 80)"/>';
      off += len; return el;
    }).join('');
    return '<svg viewBox="0 0 160 160" class="donut" role="img" aria-label="Distribusi produk per kategori"><circle r="' + R + '" cx="80" cy="80" fill="none" stroke="#eef2f7" stroke-width="22"/>' + segs +
      '<text x="80" y="82" text-anchor="middle" class="d-num">' + total + '</text><text x="80" y="100" text-anchor="middle" class="d-lbl">TOTAL SKU</text></svg>';
  }

  DK.paintTrend = function () {
    const box = document.getElementById('trend-body'); if (!box || !S.ov) return;
    const arr = S.ov.series[S.series] || [];
    const max = Math.max(1, Math.max.apply(null, arr.map(function (x) { return x.value; })));
    const peak = arr.reduce(function (a, b) { return b.value > a.value ? b : a; }, arr[0] || { label: '-', value: 0 });
    const total = arr.reduce(function (s, x) { return s + x.value; }, 0);
    const unit = { harian: 'hari', mingguan: 'minggu', bulanan: 'bulan' }[S.series];
    document.querySelectorAll('#trend-tabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.val === S.series); });
    box.innerHTML = '<div class="bars">' + arr.map(function (x) {
      const isPeak = peak.value > 0 && x === peak;
      return '<div class="bar-col"><div class="bar-area"><div class="bar' + (isPeak ? ' peak' : '') + '" style="height:' + Math.max(4, Math.round(x.value / max * 100)) + '%" title="' + x.value + ' pesan"><span>' + (x.value || '') + '</span></div></div><small>' + esc(x.label) + '</small></div>';
    }).join('') + '</div>' +
      '<div class="trend-foot"><div><small>Puncak</small><b>' + esc(peak.label) + ' (' + peak.value + ' Pesan)</b></div>' +
      '<div><small>Rata-rata per ' + unit + '</small><b>' + (arr.length ? (total / arr.length).toFixed(1).replace('.', ',') : 0) + ' Pesan</b></div>' +
      '<div><small>Status Penyelesaian</small><b class="c-tert">' + S.ov.stats.ditanggapi + '% Ditanggapi</b></div></div>';
  };

  function overviewHtml() {
    const o = S.ov, st = o.stats, sys = o.sistem;
    const avg = st.produkAktif ? Math.round(st.nilaiKatalog / st.produkAktif) : 0;
    const total = o.kategori.reduce(function (s, k) { return s + k.jumlah; }, 0);
    const pct = (sys.driveLimit ? Math.min(100, Math.round(sys.driveUsed / sys.driveLimit * 100)) : 0);

    const legend = o.kategori.length ? o.kategori.map(function (k, i) {
      return '<li><i style="background:' + COLORS[i % COLORS.length] + '"></i><span>' + esc(k.nama) + '</span><b>' + Math.round(k.jumlah / total * 100) + '% (' + k.jumlah + ')</b></li>';
    }).join('') : '<li class="muted small">Belum ada produk aktif.</li>';

    return '<div class="syncbar card">' +
      '<div class="sb-item"><i class="dot"></i><div><small>KONEKSI DATABASE &amp; DRIVE</small><div>Terhubung: Spreadsheet &amp; Drive ID: <code>' + esc(sys.ssIdMasked) + '</code></div></div></div>' +
      '<div class="sb-item">' + ic('shield', 18) + '<div><small>Sesi Token</small><div>Script Properties Aktif</div></div></div>' +
      '<button class="btn btn-primary" data-action="clear-cache">' + ic('sync', 16) + ' Sinkronisasi Data Cepat <span class="on-primary">(Clear Cache)</span></button></div>' +

      '<div class="grid4 mt16">' +
        metric('Total Produk Aktif', st.produkAktif, 'Produk', st.totalProduk + ' produk tercatat di Sheet', 'box', 'tone-primary') +
        metric('Total Formulir &amp; Pesan', st.totalPesan, 'Masuk', '<span class="pillsm tone-tert">Ditanggapi ' + st.ditanggapi + '%</span>', 'mail', 'tone-tert') +
        metric('Pesan Belum Dibaca', st.pesanBaru, 'Menunggu', st.pesanBaru ? '<span class="pillsm tone-red">Perlu respons cepat</span>' : '<span class="pillsm tone-green">Semua sudah dibaca</span>', 'bell', 'tone-red') +
        metric('Nilai Katalog', rupiah(st.nilaiKatalog), '', 'Rata-rata ' + rupiah(avg) + ' per produk', 'cash', 'tone-amber') +
      '</div>' +

      '<div class="charts mt16">' +
        '<div class="card pad"><h3>Distribusi Produk per Kategori</h3><p class="muted small">Porsi katalog aktif terdaftar pada Google Sheets</p>' +
        '<div class="donut-row">' + donut(o.kategori, total) + '<ul class="legend">' + legend + '</ul></div></div>' +
        '<div class="card pad"><div class="panel-head"><div><h3>Tren Interaksi &amp; Pesan Masuk</h3><p class="muted small">Aktivitas formulir pelanggan dari storefront web</p></div>' +
        '<div class="seg" id="trend-tabs">' + [['harian', 'Harian'], ['mingguan', 'Mingguan'], ['bulanan', 'Bulanan']].map(function (x) {
          return '<button class="' + (S.series === x[0] ? 'on' : '') + '" data-action="series" data-val="' + x[0] + '">' + x[1] + '</button>';
        }).join('') + '</div></div><div id="trend-body"></div></div></div>' +

      '<div class="grid3 mt16 sysrow">' +
        '<div class="card sys">' + ic('mail', 22) + '<div><small>KUOTA GMAIL HARIAN</small><b>' + (sys.mailSisa === null ? '-' : 'Sisa ' + sys.mailSisa + ' email hari ini') + '</b></div></div>' +
        '<div class="card sys">' + ic('cloud', 22) + '<div class="grow"><small>FOLDER GOOGLE DRIVE</small><b>' + DK.bytes(sys.driveUsed) + ' / ' + DK.bytes(sys.driveLimit) + '</b>' +
          '<div class="progress"><i style="width:' + pct + '%"></i></div></div><span class="pillsm tone-green">' + (pct < 80 ? 'Stabil' : 'Hampir penuh') + '</span></div>' +
        '<div class="card sys">' + ic('timer', 22) + '<div><small>RESPONS API TERAKHIR</small><b>' + (S.apiMs ? (S.apiMs / 1000).toFixed(1).replace('.', ',') + ' detik' : '-') + '</b></div></div>' +
      '</div>' +
      '<div class="mt16">' + msgPanel('Pesan &amp; Pemesanan Masuk Terbaru') + '</div>';
  }

  // ---------- Pesan ----------
  function msgPanel(title) {
    return '<section class="card msg-panel"><div class="panel-head"><div><h3>' + title + ' <span class="live">Live Sync</span></h3>' +
      '<p class="muted small">Data masuk melalui Google Apps Script Web App Endpoint</p></div><div id="msg-tabs" class="seg wrap-seg"></div></div>' +
      '<div class="panel-tools"><div class="inp grow">' + ic('search', 16) + '<input id="msg-q" placeholder="Cari nama, email, atau isi pesan..." value="' + esc(S.msgQ) + '"></div></div>' +
      '<div id="msg-body"></div></section>';
  }

  DK.paintMsg = function () {
    const body = document.getElementById('msg-body'); if (!body) return;
    const q = S.msgQ.trim().toLowerCase();
    const base = S.msgs.filter(function (m) { return !q || (m.nama + ' ' + m.email + ' ' + m.pesan + ' ' + m.produk).toLowerCase().indexOf(q) >= 0; });
    const cnt = function (s) { return base.filter(function (m) { return m.status === s; }).length; };
    document.getElementById('msg-tabs').innerHTML = [['Semua', base.length], ['Baru', cnt('Baru')], ['Dibaca', cnt('Dibaca')], ['Selesai', cnt('Selesai')]].map(function (x) {
      return '<button class="' + (S.msgFilter === x[0] ? 'on' : '') + '" data-action="msg-filter" data-val="' + x[0] + '">' + x[0] + ' (' + x[1] + ')</button>';
    }).join('');

    const list = base.filter(function (m) { return S.msgFilter === 'Semua' || m.status === S.msgFilter; });
    const pages = Math.max(1, Math.ceil(list.length / S.msgSize));
    if (S.msgPage > pages) S.msgPage = pages;
    const slice = list.slice((S.msgPage - 1) * S.msgSize, S.msgPage * S.msgSize);

    if (!slice.length) {
      body.innerHTML = '<div class="empty center pad">' + ic('inbox', 28) + '<p class="muted mt8">' + (S.msgs.length ? 'Tidak ada pesan yang cocok.' : 'Belum ada pesan masuk.') + '</p></div>';
      return;
    }
    const rows = slice.map(function (m) {
      const mail = 'mailto:' + esc(m.email) + '?subject=' + enc('Re: Pesan ' + m.id);
      return '<tr data-action="msg-open" data-id="' + esc(m.id) + '">' +
        '<td><code class="mid ' + (m.status === 'Baru' ? 'hot' : '') + '">' + esc(m.id) + '</code><small>' + DK.ago(m.waktu) + '</small></td>' +
        '<td><b>' + esc(m.nama) + '</b><small>' + esc(m.email) + '</small></td>' +
        '<td>' + (m.produk ? '<span class="tag-prod">' + esc(m.produk) + '</span>' : '<span class="muted small">Umum</span>') + '</td>' +
        '<td class="trunc">' + esc(m.pesan) + '</td><td>' + statusBadge(m.status) + '</td>' +
        '<td class="acts"><a class="icon-btn sm" href="' + mail + '" data-action="noop" title="Balas via email">' + ic('mail', 16) + '</a>' +
        '<button class="icon-btn sm" data-action="msg-open" data-id="' + esc(m.id) + '" title="Lihat detail">' + ic('chat', 16) + '</button>' +
        (m.status !== 'Selesai' ? '<button class="icon-btn sm" data-action="msg-done" data-id="' + esc(m.id) + '" title="Tandai selesai">' + ic('check', 16) + '</button>' : '') + '</td></tr>';
    }).join('');

    let pager = '';
    if (pages > 1) {
      pager = '<div class="pager"><button class="pg" data-action="msg-page" data-val="' + (S.msgPage - 1) + '"' + (S.msgPage <= 1 ? ' disabled' : '') + '>Sebelumnya</button>';
      for (let i = 1; i <= pages; i++) pager += '<button class="pg' + (i === S.msgPage ? ' on' : '') + '" data-action="msg-page" data-val="' + i + '">' + i + '</button>';
      pager += '<button class="pg" data-action="msg-page" data-val="' + (S.msgPage + 1) + '"' + (S.msgPage >= pages ? ' disabled' : '') + '>Selanjutnya</button></div>';
    }
    body.innerHTML = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>ID &amp; Waktu</th><th>Pengirim</th><th>Produk Diminati</th><th>Ringkasan Pesan</th><th>Status</th><th>Aksi</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div class="tbl-foot"><span class="muted small">Menampilkan ' + slice.length + ' dari total ' + list.length + ' pesan masuk</span>' + pager + '</div>';
  };

  async function setStatus(id, status, quiet) {
    const m = S.msgs.filter(function (x) { return x.id === id; })[0]; if (!m) return;
    const before = m.status; if (before === status) return;
    const apply = function (from, to) {
      m.status = to;
      if (S.ov) {
        const st = S.ov.stats;
        if (from === 'Baru' && to !== 'Baru') st.pesanBaru = Math.max(0, st.pesanBaru - 1);
        if (from !== 'Baru' && to === 'Baru') st.pesanBaru++;
        st.ditanggapi = st.totalPesan ? Math.round((st.totalPesan - st.pesanBaru) / st.totalPesan * 100) : 0;
      }
    };
    apply(before, status);
    try {
      await Api.post('setMessageStatus', { id: id, status: status });
      if (!quiet) DK.toast('Status diperbarui: ' + status);
    } catch (e) { apply(status, before); handleErr(e); }
    if (current === '' || current === 'pesan') repaint();
  }

  function openMsg(id) {
    const m = S.msgs.filter(function (x) { return x.id === id; })[0]; if (!m) return;
    if (m.status === 'Baru') setStatus(id, 'Dibaca', true);
    const d = new Date(m.waktu);
    DK.openModal(
      '<div class="modal-head"><div><small class="eyebrow">' + esc(m.id) + '</small><h3>Pesan dari ' + esc(m.nama) + '</h3></div><button class="icon-btn" data-action="modal-close" aria-label="Tutup">' + ic('x', 20) + '</button></div>' +
      '<dl class="meta"><div><dt>Email</dt><dd>' + esc(m.email) + '</dd></div><div><dt>Produk diminati</dt><dd>' + esc(m.produk || 'Pertanyaan umum') + '</dd></div>' +
      '<div><dt>Waktu</dt><dd>' + (isNaN(d) ? '-' : d.toLocaleString('id-ID')) + '</dd></div></dl>' +
      '<div class="msgbox prewrap">' + esc(m.pesan) + '</div>' +
      '<div class="modal-foot"><div class="seg">' + ['Baru', 'Dibaca', 'Selesai'].map(function (s) {
        return '<button class="' + (m.status === s ? 'on' : '') + '" data-action="msg-set" data-id="' + esc(m.id) + '" data-val="' + s + '">' + s + '</button>';
      }).join('') + '</div><a class="btn btn-primary" href="mailto:' + esc(m.email) + '?subject=' + enc('Re: Pesan ' + m.id) + '">' + ic('mail', 16) + ' Balas via Email</a></div>');
  }

  // ---------- Katalog & Berkas ----------
  function prodFiltered() {
    const q = S.prodQ.trim().toLowerCase();
    return S.prods.filter(function (p) {
      return (S.prodFilter === 'Semua' || p.status === S.prodFilter) && (!S.prodCat || p.kategori === S.prodCat) &&
        (!q || (p.id + ' ' + p.nama + ' ' + p.kategori).toLowerCase().indexOf(q) >= 0);
    });
  }

  DK.paintProd = function () {
    const body = document.getElementById('prod-body'); if (!body) return;
    const cnt = function (s) { return S.prods.filter(function (p) { return p.status === s; }).length; };
    document.getElementById('prod-tabs').innerHTML = [['Semua', S.prods.length], ['Aktif', cnt('Aktif')], ['Nonaktif', cnt('Nonaktif')]].map(function (x) {
      return '<button class="' + (S.prodFilter === x[0] ? 'on' : '') + '" data-action="prod-filter" data-val="' + x[0] + '">' + x[0] + ' (' + x[1] + ')</button>';
    }).join('');
    const list = prodFiltered();
    if (!list.length) {
      body.innerHTML = '<div class="empty center pad">' + ic('box', 28) + '<p class="muted mt8">' + (S.prods.length ? 'Tidak ada produk yang cocok.' : 'Belum ada produk. Klik "Tambah Produk Baru".') + '</p></div>';
      return;
    }
    body.innerHTML = '<div class="tbl-wrap"><table class="tbl prod"><thead><tr><th>Thumbnail</th><th>ID &amp; Nama Produk</th><th>Kategori</th><th>Harga</th><th>Status</th><th>Tautan</th><th>Aksi</th></tr></thead><tbody>' +
      list.map(function (p) {
        const off = p.status !== 'Aktif';
        return '<tr class="' + (off ? 'off' : '') + '"><td><div class="tiny">' + DK.thumb(p) + '</div></td>' +
          '<td><code class="mid">' + esc(p.id) + '</code><b class="pname">' + esc(p.nama) + '</b><small class="clamp1">' + esc(p.deskripsi) + '</small></td>' +
          '<td>' + (p.kategori ? '<span class="tag-prod">' + esc(p.kategori) + '</span>' : '-') + '</td>' +
          '<td class="nowrap">' + rupiah(p.harga) + (p.hargaCoret > p.harga ? '<small><s>' + rupiah(p.hargaCoret) + '</s></small>' : '') + '</td>' +
          '<td>' + statusBadge(p.status) + '</td>' +
          '<td class="acts">' + (DK.safeUrl(p.file) ? '<a class="icon-btn sm" href="' + esc(p.file) + '" target="_blank" rel="noopener" title="Buka file produk (privat)">' + ic('folder', 16) + '</a>' : '<span class="icon-btn sm dim">' + ic('folder', 16) + '</span>') +
          (DK.safeUrl(p.linkBeli) ? '<a class="icon-btn sm" href="' + esc(p.linkBeli) + '" target="_blank" rel="noopener" title="Buka link pembelian">' + ic('cart', 16) + '</a>' : '<span class="icon-btn sm dim">' + ic('cart', 16) + '</span>') + '</td>' +
          '<td class="acts"><button class="icon-btn sm" data-action="prod-edit" data-id="' + esc(p.id) + '" title="Ubah">' + ic('edit', 16) + '</button>' +
          '<button class="icon-btn sm danger" data-action="prod-del" data-id="' + esc(p.id) + '" title="Hapus">' + ic('trash', 16) + '</button></td></tr>';
      }).join('') + '</tbody></table></div><div class="tbl-foot"><span class="muted small">Menampilkan ' + list.length + ' dari ' + S.prods.length + ' produk digital (Sheet "Produk")</span></div>';
  };

  function produkHtml() {
    const aktif = S.prods.filter(function (p) { return p.status === 'Aktif'; });
    const nilai = aktif.reduce(function (s, p) { return s + p.harga; }, 0);
    const kat = {}; S.prods.forEach(function (p) { if (p.kategori) kat[p.kategori] = 1; });
    const cats = Object.keys(kat);
    return '<div class="page-head"><div><small class="eyebrow">MASTER DATABASE • SHEET: PRODUK</small><h1>Kelola Produk Digital</h1>' +
      '<p class="muted">Sinkron dengan Google Sheets dan Google Drive. Perubahan langsung tampil di katalog publik.</p></div>' +
      '<div class="head-btns">' + (S.sheetUrl ? '<a class="btn btn-ghost" href="' + esc(S.sheetUrl) + '" target="_blank" rel="noopener">' + ic('external', 16) + ' Buka Google Sheet</a>' : '') +
      '<button class="btn btn-primary" data-action="prod-add">' + ic('plus', 16) + ' Tambah Produk Baru</button></div></div>' +
      '<div class="grid4 mt16">' +
        metric('TOTAL PRODUK', S.prods.length, 'Item', 'Tersinkron di Sheet', 'checkCircle', 'tone-primary') +
        metric('STATUS AKTIF', aktif.length, 'Aktif', 'Tayang di etalase web', 'eye', 'tone-blue') +
        metric('KATEGORI', cats.length, 'Jenis', 'Dipakai untuk filter katalog', 'layers', 'tone-tert') +
        metric('NILAI KATALOG', rupiah(nilai), '', 'Rata-rata ' + rupiah(aktif.length ? Math.round(nilai / aktif.length) : 0), 'cash', 'tone-amber') +
      '</div>' +
      '<div class="card pad toolbar mt16"><div class="inp grow">' + ic('search', 16) + '<input id="prod-q" placeholder="Cari ID produk, nama, atau kategori..." value="' + esc(S.prodQ) + '"></div>' +
        '<div class="seg" id="prod-tabs"></div>' +
        '<select id="prod-cat"><option value="">Semua Kategori</option>' + cats.map(function (c) { return '<option' + (S.prodCat === c ? ' selected' : '') + ' value="' + esc(c) + '">' + esc(c) + '</option>'; }).join('') + '</select>' +
        '<button class="icon-btn" data-action="prod-refresh" title="Muat ulang">' + ic('refresh', 18) + '</button></div>' +
      '<div class="card mt16" id="prod-body"></div>';
  }

  // ---- Form produk ----
  function openProdForm(id) {
    const p = id ? S.prods.filter(function (x) { return x.id === id; })[0] : null;
    pending = { foto: null, file: null };
    const v = function (k, d) { return esc(p ? (p[k] == null ? '' : p[k]) : (d || '')); };
    const cats = Array.from(new Set(S.prods.map(function (x) { return x.kategori; }).filter(Boolean)));
    DK.openModal(
      '<form data-form="product"><input type="hidden" name="id" value="' + v('id') + '">' +
      '<div class="modal-head"><div><small class="eyebrow">' + (p ? 'UBAH PRODUK ' + esc(p.id) : 'PRODUK BARU') + '</small><h3>' + (p ? 'Ubah Produk Digital' : 'Tambah Produk Digital') + '</h3></div>' +
      '<button type="button" class="icon-btn" data-action="modal-close" aria-label="Tutup">' + ic('x', 20) + '</button></div>' +
      '<div class="form-grid">' +
        '<label class="field span2"><span>Nama Produk <i>*</i></span><input name="nama" required maxlength="150" value="' + v('nama') + '"></label>' +
        '<label class="field"><span>Kategori</span><input name="kategori" list="cat-list" maxlength="60" value="' + v('kategori') + '" placeholder="Mis. Template Sheets"><datalist id="cat-list">' + cats.map(function (c) { return '<option value="' + esc(c) + '">'; }).join('') + '</datalist></label>' +
        '<label class="field"><span>Status</span><select name="status"><option' + (!p || p.status === 'Aktif' ? ' selected' : '') + '>Aktif</option><option' + (p && p.status === 'Nonaktif' ? ' selected' : '') + '>Nonaktif</option></select></label>' +
        '<label class="field"><span>Harga (Rp) <i>*</i></span><input name="harga" type="number" min="0" step="1" required value="' + v('harga') + '"></label>' +
        '<label class="field"><span>Harga Coret (opsional)</span><input name="hargaCoret" type="number" min="0" step="1" value="' + (p && p.hargaCoret ? p.hargaCoret : '') + '" placeholder="Harga sebelum diskon"></label>' +
        '<label class="field span2"><span>Deskripsi</span><textarea name="deskripsi" rows="3" maxlength="3000">' + v('deskripsi') + '</textarea></label>' +
        '<label class="field span2"><span>Fitur Unggulan <em class="hint">satu baris = satu poin</em></span><textarea name="fitur" rows="3" maxlength="2000">' + v('fitur') + '</textarea></label>' +
        '<label class="field"><span>Kompatibilitas</span><textarea name="kompatibilitas" rows="2" maxlength="1000">' + v('kompatibilitas') + '</textarea></label>' +
        '<label class="field"><span>Lisensi</span><textarea name="lisensi" rows="2" maxlength="1000">' + v('lisensi') + '</textarea></label>' +
        '<label class="field"><span>Label Badge (opsional)</span><input name="badge" maxlength="30" value="' + v('badge') + '" placeholder="Mis. Best Seller"></label>' +
        '<label class="field"><span>Link Pembelian</span><input name="linkBeli" type="url" maxlength="500" value="' + v('linkBeli') + '" placeholder="https://..."></label>' +
        '<div class="field span2 upload"><span>Foto Produk <em class="hint">JPG/PNG/WEBP, otomatis dikecilkan • tampil publik</em></span>' +
          '<div class="up-row"><div class="up-prev" id="foto-prev">' + (p && DK.safeUrl(p.foto) ? '<img src="' + esc(p.foto) + '" alt="" referrerpolicy="no-referrer">' : ic('image', 28)) + '</div>' +
          '<div class="grow"><input type="file" id="foto-file" accept="image/jpeg,image/png,image/webp,image/gif"><input name="foto" type="url" maxlength="500" value="' + v('foto') + '" placeholder="atau tempel URL foto (https://...)"></div></div></div>' +
        '<div class="field span2 upload"><span>File Produk Digital (opsional) <em class="hint">maks. 5 MB • tersimpan PRIVAT di Drive</em></span>' +
          '<div class="up-row"><div class="grow"><input type="file" id="berkas-file"><input name="file" type="url" maxlength="500" value="' + v('file') + '" placeholder="atau tempel URL file (https://...)"></div></div></div>' +
      '</div><div class="form-msg" role="status"></div>' +
      '<div class="modal-foot"><button type="button" class="btn btn-ghost" data-action="modal-close">Batal</button><button class="btn btn-primary" type="submit">' + ic('check', 16) + ' Simpan Produk</button></div></form>', true);
  }

  function compressImage(file) {
    return new Promise(function (res, rej) {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        const r = Math.min(1, 1200 / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
        const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(function (b) { URL.revokeObjectURL(url); b ? res(b) : rej(new Error('Gagal memproses gambar.')); }, 'image/jpeg', 0.82);
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('File gambar tidak valid.')); };
      img.src = url;
    });
  }
  function toBase64(blob) {
    return new Promise(function (res, rej) {
      const fr = new FileReader();
      fr.onload = function () { res(String(fr.result).split(',')[1]); };
      fr.onerror = function () { rej(new Error('Gagal membaca berkas.')); };
      fr.readAsDataURL(blob);
    });
  }

  DK.onFileChange = async function (el) {
    const f = el.files && el.files[0]; if (!f) return;
    try {
      if (el.id === 'foto-file') {
        const b = await compressImage(f);
        pending.foto = { blob: b, name: f.name.replace(/\.\w+$/, '') + '.jpg' };
        document.getElementById('foto-prev').innerHTML = '<img src="' + URL.createObjectURL(b) + '" alt="">';
      } else if (el.id === 'berkas-file') {
        if (f.size > 5 * 1024 * 1024) { el.value = ''; return DK.toast('Ukuran file maksimal 5 MB. Untuk file besar, unggah manual ke Drive lalu tempel URL-nya.', 'error'); }
        pending.file = f;
      }
    } catch (e) { DK.toast(e.message, 'error'); el.value = ''; }
  };

  DK.submitProduct = async function (form) {
    const f = form.elements, btn = form.querySelector('button[type=submit]'), msg = form.querySelector('.form-msg');
    const show = function (t) { msg.className = 'form-msg error'; msg.textContent = t; };
    const d = {
      id: f.id.value, nama: f.nama.value.trim(), kategori: f.kategori.value.trim(), status: f.status.value,
      harga: f.harga.value, hargaCoret: f.hargaCoret.value, deskripsi: f.deskripsi.value, fitur: f.fitur.value,
      kompatibilitas: f.kompatibilitas.value, lisensi: f.lisensi.value, badge: f.badge.value.trim(),
      linkBeli: f.linkBeli.value.trim(), foto: f.foto.value.trim(), file: f.file.value.trim()
    };
    if (!d.nama) return show('Nama produk wajib diisi.');
    if (d.harga === '' || Number(d.harga) < 0) return show('Harga wajib diisi dengan angka 0 atau lebih.');
    btn.disabled = true; const old = btn.innerHTML; msg.textContent = ''; msg.className = 'form-msg';
    try {
      if (pending.foto) {
        btn.textContent = 'Mengunggah foto...';
        const j = await Api.post('uploadFile', { kind: 'foto', filename: pending.foto.name, mimeType: 'image/jpeg', base64: await toBase64(pending.foto.blob) });
        d.foto = j.data.url;
      }
      if (pending.file) {
        btn.textContent = 'Mengunggah file...';
        const j = await Api.post('uploadFile', { kind: 'file', filename: pending.file.name, mimeType: pending.file.type || 'application/octet-stream', base64: await toBase64(pending.file) });
        d.file = j.data.url;
      }
      btn.textContent = 'Menyimpan...';
      const j = await Api.post('saveProduct', d);
      DK.toast(j.message || 'Produk disimpan.');
      DK.closeModal(); S.pub = null;
      await PAGES.produk.load(); repaint();
    } catch (e) {
      if (!handleErr(e)) show(e.message);
      btn.disabled = false; btn.innerHTML = old;
    }
  };

  function confirmDelete(id) {
    const p = S.prods.filter(function (x) { return x.id === id; })[0]; if (!p) return;
    DK.openModal('<div class="modal-head"><h3>Hapus produk?</h3><button class="icon-btn" data-action="modal-close" aria-label="Tutup">' + ic('x', 20) + '</button></div>' +
      '<p>Produk <b>' + esc(p.nama) + '</b> (' + esc(p.id) + ') akan dihapus permanen dari Google Sheets dan tidak tampil lagi di katalog.</p>' +
      '<p class="muted small mt8">Untuk menyembunyikan sementara, ubah statusnya menjadi Nonaktif.</p>' +
      '<div class="modal-foot"><button class="btn btn-ghost" data-action="modal-close">Batal</button><button class="btn btn-danger" data-action="prod-del-ok" data-id="' + esc(p.id) + '">' + ic('trash', 16) + ' Ya, hapus</button></div>');
  }

  // ---------- Sync & Pengaturan ----------
  function syncHtml() {
    const sys = S.ov.sistem;
    return '<div class="page-head"><div><small class="eyebrow">INTEGRASI GOOGLE WORKSPACE</small><h1>Google Sheets Sync</h1>' +
      '<p class="muted">Google Sheets adalah database utama. Anda boleh mengedit data langsung di Sheet, lalu bersihkan cache agar katalog publik ikut berubah.</p></div></div>' +
      '<div class="grid3 mt16">' +
        '<div class="card pad"><div class="m-ic tone-primary">' + ic('layers', 22) + '</div><h3 class="mt12">Spreadsheet Database</h3><p class="muted small">Sheet: Produk, Pesan, Pengaturan, AppConfig.<br>ID: <code>' + esc(sys.ssIdMasked) + '</code></p>' +
          (sys.sheetUrl ? '<a class="btn btn-ghost btn-sm mt12" href="' + esc(sys.sheetUrl) + '" target="_blank" rel="noopener">' + ic('external', 14) + ' Buka Google Sheet</a>' : '') + '</div>' +
        '<div class="card pad"><div class="m-ic tone-amber">' + ic('folder', 22) + '</div><h3 class="mt12">Folder Google Drive</h3><p class="muted small">Foto dan file produk tersimpan di folder Uploads.<br>Terpakai: ' + DK.bytes(sys.driveUsed) + ' / ' + DK.bytes(sys.driveLimit) + '</p>' +
          (sys.folderUrl ? '<a class="btn btn-ghost btn-sm mt12" href="' + esc(sys.folderUrl) + '" target="_blank" rel="noopener">' + ic('external', 14) + ' Buka Folder Drive</a>' : '') + '</div>' +
        '<div class="card pad"><div class="m-ic tone-tert">' + ic('sync', 22) + '</div><h3 class="mt12">Cache Katalog</h3><p class="muted small">Katalog publik disimpan sementara (±30 menit) agar cepat. Perubahan lewat panel admin otomatis membersihkan cache.</p>' +
          '<button class="btn btn-primary btn-sm mt12" data-action="clear-cache">' + ic('sync', 14) + ' Bersihkan Cache Sekarang</button></div></div>' +
      '<div class="card pad mt16"><h3>Kapan harus membersihkan cache?</h3><ul class="checks mt12">' +
        '<li>' + ic('checkCircle', 18) + '<span>Setelah Anda mengedit sel di Google Sheets secara manual (harga, status, deskripsi).</span></li>' +
        '<li>' + ic('checkCircle', 18) + '<span>Setelah mengganti nama atau urutan produk langsung di Sheet.</span></li>' +
        '<li>' + ic('checkCircle', 18) + '<span>Tidak perlu jika Anda mengubah data lewat halaman Katalog &amp; Berkas — itu otomatis.</span></li></ul></div>';
  }

  function settingsHtml() {
    const s = S.settings || {};
    const f = function (k, label, hint, multi) {
      return '<label class="field span2"><span>' + label + (hint ? ' <em class="hint">' + hint + '</em>' : '') + '</span>' +
        (multi ? '<textarea name="' + k + '" rows="3" maxlength="500">' + esc(s[k]) + '</textarea>' : '<input name="' + k + '" maxlength="500" value="' + esc(s[k]) + '">') + '</label>';
    };
    return '<div class="page-head"><div><small class="eyebrow">KONFIGURASI SITUS</small><h1>Pengaturan Web</h1><p class="muted">Teks dan kontak yang tampil di toko publik. Disimpan di sheet "Pengaturan".</p></div></div>' +
      '<form class="card pad mt16" data-form="settings"><div class="form-grid">' +
      f('NAMA_SITUS', 'Nama Situs') + f('TAGLINE_SITUS', 'Tagline Logo') + f('HERO_JUDUL', 'Judul Beranda') + f('HERO_DESKRIPSI', 'Deskripsi Beranda', '', true) +
      f('WHATSAPP', 'Nomor WhatsApp', 'format 628xxxxxxxxxx, tanpa + atau spasi; kosongkan jika tidak dipakai') +
      f('EMAIL_ADMIN', 'Email Penerima Notifikasi', 'kosong = email pemilik script') + f('FOOTER_DESKRIPSI', 'Teks Footer', '', true) +
      '</div><div class="form-msg" role="status"></div><div class="modal-foot"><button class="btn btn-primary" type="submit">' + ic('check', 16) + ' Simpan Pengaturan</button></div></form>' +
      '<div class="card pad mt16"><h3>Ganti Password Admin</h3><p class="muted small mt8">Demi keamanan, password tidak bisa diubah dari web. Buka Apps Script → Project Settings → Script Properties → ubah nilai <code>ADMIN_PASSWORD</code>.</p></div>';
  }

  DK.submitSettings = async function (form) {
    const btn = form.querySelector('button[type=submit]'), msg = form.querySelector('.form-msg');
    const d = {}; Array.from(form.elements).forEach(function (el) { if (el.name) d[el.name] = el.value; });
    btn.disabled = true; msg.textContent = ''; msg.className = 'form-msg';
    try {
      const j = await Api.post('saveSettings', d);
      S.settings = Object.assign(S.settings || {}, d); S.pub = null;
      DK.toast(j.message);
    } catch (e) { if (!handleErr(e)) { msg.className = 'form-msg error'; msg.textContent = e.message; } }
    btn.disabled = false;
  };

  // ---------- Definisi halaman ----------
  const PAGES = {
    '': {
      load: async function () {
        const j = await Api.post('overview');
        S.ov = j.data; S.msgs = j.data.pesan; S.settings = j.data.settings;
        S.msgFilter = 'Semua'; S.msgPage = 1; S.msgQ = ''; S.msgSize = 5;
      },
      html: overviewHtml, after: function () { DK.paintTrend(); DK.paintMsg(); }
    },
    produk: {
      load: async function () {
        const j = await Api.post('listProducts'); S.prods = j.data;
        if (!S.ov) { try { const o = await Api.post('overview'); S.ov = o.data; S.settings = o.data.settings; } catch (e) { if (e.code === 'AUTH') throw e; } }
        S.sheetUrl = S.ov ? S.ov.sistem.sheetUrl : '';
      },
      html: produkHtml, after: function () { DK.paintProd(); }
    },
    pesan: {
      load: async function () {
        const j = await Api.post('listMessages'); S.msgs = j.data;
        S.msgFilter = 'Semua'; S.msgPage = 1; S.msgQ = ''; S.msgSize = 10;
        if (!S.ov) { try { const o = await Api.post('overview'); S.ov = o.data; S.settings = o.data.settings; } catch (e) { if (e.code === 'AUTH') throw e; } }
      },
      html: function () {
        return '<div class="page-head"><div><small class="eyebrow">FR-08 • SHEET: PESAN</small><h1>Pesanan &amp; Leads</h1><p class="muted">Semua pesan dan permintaan pemesanan dari formulir toko publik.</p></div></div><div class="mt16">' + msgPanel('Pesan &amp; Pemesanan Masuk') + '</div>';
      },
      after: function () { DK.paintMsg(); }
    },
    sync: { load: async function () { const j = await Api.post('overview'); S.ov = j.data; S.msgs = j.data.pesan; S.settings = j.data.settings; }, html: syncHtml },
    pengaturan: { load: async function () { const j = await Api.post('getSettings'); S.settings = j.data; }, html: settingsHtml }
  };

  // ---------- Handler aksi (dipanggil dari app.js) ----------
  DK.onAdminClick = function (action, el) {
    switch (action) {
      case 'noop': return true;
      case 'logout':
        Api.post('logout').catch(function () {}).then(function () {
          Api.setToken(''); S.ov = null; S.msgs = []; S.prods = []; location.hash = '#/'; DK.route();
        });
        return true;
      case 'toggle-sidebar': document.body.classList.toggle('side-open'); return true;
      case 'retry-admin': DK.route(); return true;
      case 'clear-cache':
        Api.post('clearCache').then(function (j) { S.pub = null; DK.toast(j.message); }).catch(handleErr);
        return true;
      case 'series': S.series = el.dataset.val; DK.paintTrend(); return true;
      case 'msg-filter': S.msgFilter = el.dataset.val; S.msgPage = 1; DK.paintMsg(); return true;
      case 'msg-page': S.msgPage = Number(el.dataset.val) || 1; DK.paintMsg(); return true;
      case 'msg-open': openMsg(el.dataset.id); return true;
      case 'msg-done': setStatus(el.dataset.id, 'Selesai'); return true;
      case 'msg-set': setStatus(el.dataset.id, el.dataset.val).then(function () { openMsg(el.dataset.id); }); return true;
      case 'prod-filter': S.prodFilter = el.dataset.val; DK.paintProd(); return true;
      case 'prod-add': openProdForm(''); return true;
      case 'prod-edit': openProdForm(el.dataset.id); return true;
      case 'prod-del': confirmDelete(el.dataset.id); return true;
      case 'prod-del-ok':
        el.disabled = true;
        Api.post('deleteProduct', { id: el.dataset.id }).then(function (j) {
          DK.closeModal(); S.pub = null; DK.toast(j.message);
          return PAGES.produk.load().then(repaint);
        }).catch(function (e) { el.disabled = false; handleErr(e); });
        return true;
      case 'prod-refresh':
        PAGES.produk.load().then(function () { repaint(); DK.toast('Data dimuat ulang.'); }).catch(handleErr);
        return true;
    }
    return false;
  };

  DK.onAdminInput = function (el) {
    if (el.id === 'msg-q') { S.msgQ = el.value; S.msgPage = 1; DK.paintMsg(); return true; }
    if (el.id === 'prod-q') { S.prodQ = el.value; DK.paintProd(); return true; }
    return false;
  };
  DK.onAdminChange = function (el) {
    if (el.id === 'prod-cat') { S.prodCat = el.value; DK.paintProd(); return true; }
    if (el.id === 'foto-file' || el.id === 'berkas-file') { DK.onFileChange(el); return true; }
    return false;
  };
})();
