// ============================================================
// PUBLIK — beranda katalog, detail produk, formulir kontak
// ============================================================
(function () {
  const DK = window.DK = window.DK || {};
  const S = DK.S, esc = DK.esc, ic = DK.ic, rupiah = DK.rupiah;
  const enc = encodeURIComponent;

  function settings() {
    const d = {
      NAMA_SITUS: 'DigiKatalog', TAGLINE_SITUS: 'Produk Digital Terpilih',
      HERO_JUDUL: 'Solusi Produk Digital Praktis & Siap Pakai',
      HERO_DESKRIPSI: 'Template, e-book, script, dan desain kreatif untuk membantu pekerjaan Anda lebih cepat.',
      WHATSAPP: '', FOOTER_DESKRIPSI: ''
    };
    return Object.assign(d, (S.pub && S.pub.settings) || {});
  }
  DK.siteSettings = settings;

  DK.loadPublic = async function (force) {
    if (S.pub && !force) return true;
    try {
      S.pub = await DK.Api.get('getProducts');
      S.pubError = '';
      document.title = settings().NAMA_SITUS + ' — Produk Digital';
      return true;
    } catch (e) { S.pub = null; S.pubError = e.message; return false; }
  };

  // ---------- Kerangka halaman publik ----------
  function header() {
    const s = settings();
    const wa = DK.waLink(s.WHATSAPP, 'Halo, saya tertarik dengan produk digital Anda.');
    return '<header class="topbar glass"><div class="wrap topbar-in">' +
      '<a class="brand" href="#/">' + DK.logo() + '<span><b>' + esc(s.NAMA_SITUS) + '</b><small>' + esc(s.TAGLINE_SITUS) + '</small></span></a>' +
      '<nav class="nav" aria-label="Navigasi utama">' +
        '<button class="navlink" data-action="scroll" data-target="katalog">Katalog Produk</button>' +
        '<button class="navlink" data-action="scroll" data-target="cara">Cara Pemesanan</button>' +
        '<button class="navlink" data-action="scroll" data-target="kontak">Kontak &amp; Bantuan</button>' +
      '</nav>' +
      '<div class="topbar-act">' +
        (wa ? '<a class="btn btn-accent btn-sm hide-sm" href="' + esc(wa) + '" target="_blank" rel="noopener">' + ic('chat', 16) + ' Beli via WhatsApp</a>' : '') +
        '<a class="pill-admin" href="#/admin">' + ic('user', 16) + '<span>Admin Portal</span></a>' +
      '</div></div></header>';
  }

  function footer() {
    const s = settings();
    return '<footer class="footer"><div class="wrap">' +
      '<div class="footer-top"><div><div class="brand">' + DK.logo(28) + '<span><b>' + esc(s.NAMA_SITUS) + '</b></span></div>' +
      '<p class="muted small mt8">' + esc(s.FOOTER_DESKRIPSI) + '</p></div>' +
      '<span class="chip-note">' + ic('bolt', 14) + ' Berjalan di Google Apps Script, Sheets &amp; Drive</span></div>' +
      '<div class="footer-bot"><span class="muted small">© ' + new Date().getFullYear() + ' ' + esc(s.NAMA_SITUS) + '. Hak cipta dilindungi.</span>' +
      '<a class="small link" href="#/admin">' + ic('lock', 14) + ' Akses Administrator</a></div></div></footer>';
  }

  DK.renderPublic = function (inner) {
    document.getElementById('app').innerHTML = header() + '<main>' + inner + '</main>' + footer();
  };

  function errorBox() {
    return '<section class="wrap section"><div class="card pad center"><h2>Katalog belum bisa dimuat</h2>' +
      '<p class="muted mt8">' + esc(S.pubError || 'Terjadi kesalahan.') + '</p>' +
      '<button class="btn btn-primary mt16" data-action="reload-pub">' + ic('refresh', 16) + ' Coba lagi</button></div></section>';
  }

  function skeletonHome() {
    const c = '<div class="pcard skel"><div class="skel-img"></div><div class="pcard-body"><div class="skel-line"></div><div class="skel-line s"></div></div></div>';
    return '<section class="wrap hero"><div><div class="skel-line w60"></div><div class="skel-line w80 big"></div><div class="skel-line"></div></div></section>' +
      '<section class="wrap section"><div class="grid-products">' + c + c + c + '</div></section>';
  }

  // ---------- Kartu produk ----------
  function card(p) {
    const link = DK.safeUrl(p.linkBeli);
    const det = '#/produk/' + enc(p.id);
    const coret = p.hargaCoret > p.harga ? '<s>' + rupiah(p.hargaCoret) + '</s>' : '';
    const buy = link
      ? '<a class="btn btn-accent btn-sm" href="' + esc(link) + '" target="_blank" rel="noopener">' + ic('cart', 16) + ' Beli Cepat</a>'
      : '<a class="btn btn-accent btn-sm" href="' + det + '">' + ic('chat', 16) + ' Pesan</a>';
    return '<article class="pcard">' +
      '<a class="pcard-img" href="' + det + '" aria-label="' + esc(p.nama) + '">' + DK.thumb(p) +
        (p.badge ? '<span class="badge-top">' + esc(p.badge) + '</span>' : '') +
        (p.kategori ? '<span class="cat-glass">' + esc(p.kategori) + '</span>' : '') + '</a>' +
      '<div class="pcard-body"><h3 class="clamp2"><a href="' + det + '">' + esc(p.nama) + '</a></h3>' +
      '<p class="muted small clamp2">' + esc(p.deskripsi) + '</p>' +
      '<div class="price"><b>' + rupiah(p.harga) + '</b>' + coret + '</div>' +
      '<div class="pcard-act"><a class="btn btn-soft btn-sm" href="' + det + '">Detail</a>' + buy + '</div></div></article>';
  }

  function filtered() {
    const list = (S.pub ? S.pub.produk : []).slice();
    const q = S.q.trim().toLowerCase();
    const r = list.filter(function (p) {
      return (S.cat === 'Semua' || p.kategori === S.cat) &&
        (!q || (p.nama + ' ' + p.deskripsi + ' ' + p.kategori).toLowerCase().indexOf(q) >= 0);
    });
    const by = {
      terbaru: function (a, b) { return new Date(b.dibuat) - new Date(a.dibuat); },
      murah: function (a, b) { return a.harga - b.harga; },
      mahal: function (a, b) { return b.harga - a.harga; },
      nama: function (a, b) { return String(a.nama).localeCompare(String(b.nama), 'id'); }
    };
    return r.sort(by[S.sort] || by.terbaru);
  }

  DK.paintGrid = function () {
    const g = document.getElementById('grid'); if (!g) return;
    const r = filtered();
    g.innerHTML = r.length ? r.map(card).join('')
      : '<div class="empty card pad center">' + ic('search', 28) + '<h3 class="mt8">Produk tidak ditemukan</h3><p class="muted small">Coba kata kunci atau kategori lain.</p>' +
        '<button class="btn btn-soft btn-sm mt12" data-action="reset-filter">Reset pencarian</button></div>';
    const c = document.getElementById('count'); if (c) c.textContent = 'Menampilkan ' + r.length + ' Produk';
  };

  DK.paintChips = function () {
    const el = document.getElementById('chips'); if (!el || !S.pub) return;
    const all = S.pub.produk;
    const cats = S.pub.kategori || [];
    el.innerHTML = '<button class="chip' + (S.cat === 'Semua' ? ' on' : '') + '" data-action="cat" data-val="Semua">Semua Kategori (' + all.length + ')</button>' +
      cats.map(function (k) {
        const n = all.filter(function (p) { return p.kategori === k; }).length;
        return '<button class="chip' + (S.cat === k ? ' on' : '') + '" data-action="cat" data-val="' + esc(k) + '">' + esc(k) + ' (' + n + ')</button>';
      }).join('');
  };

  // ---------- Formulir kontak ----------
  function contactForm(produk, locked) {
    const prods = S.pub ? S.pub.produk : [];
    const opts = '<option value="">Pertanyaan umum</option>' + prods.map(function (p) {
      return '<option value="' + esc(p.nama) + '"' + (p.nama === produk ? ' selected' : '') + '>' + esc(p.nama) + '</option>';
    }).join('');
    return '<form class="cform" data-form="contact" novalidate>' +
      '<div class="grid2">' +
        '<label class="field"><span>Nama Lengkap <i>*</i></span><div class="inp">' + ic('user', 18) + '<input name="nama" required maxlength="100" placeholder="Contoh: Rian Anggoro" autocomplete="name"></div></label>' +
        '<label class="field"><span>Alamat Email <i>*</i></span><div class="inp">' + ic('mail', 18) + '<input name="email" type="email" required maxlength="120" placeholder="nama@email.com" autocomplete="email"></div></label>' +
      '</div>' +
      '<label class="field"><span>Produk Diminati' + (locked ? ' <em class="hint">Terkunci otomatis dari halaman ini</em>' : '') + '</span>' +
        '<select name="produk"' + (locked ? ' disabled' : '') + '>' + opts + '</select></label>' +
      '<label class="field"><span>Isi Pesan / Catatan Pemesanan <i>*</i></span><textarea name="pesan" rows="5" required maxlength="2000" placeholder="Tuliskan pertanyaan atau kebutuhan Anda..."></textarea></label>' +
      '<div class="hp" aria-hidden="true"><input name="website" tabindex="-1" autocomplete="off"></div>' +
      '<div class="cform-foot"><small class="muted">' + ic('lock', 14) + ' Data aman, tidak akan disebarkan.</small>' +
      '<button class="btn btn-primary" type="submit">' + ic('send', 16) + ' Kirim Pesan</button></div>' +
      '<div class="form-msg" role="status"></div></form>';
  }

  DK.submitContact = async function (form) {
    const btn = form.querySelector('button[type=submit]');
    const msg = form.querySelector('.form-msg');
    const show = function (t, type) { msg.className = 'form-msg ' + type; msg.textContent = t; };
    const f = form.elements;
    const d = { nama: f.nama.value.trim(), email: f.email.value.trim(), produk: f.produk.value, pesan: f.pesan.value.trim(), website: f.website.value };
    if (!d.nama || !d.email || !d.pesan) return show('Nama, email, dan pesan wajib diisi.', 'error');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) return show('Format email tidak valid.', 'error');
    if (d.pesan.length < 5) return show('Pesan terlalu singkat.', 'error');

    const old = btn.innerHTML;
    btn.disabled = true; btn.textContent = 'Mengirim...';
    try {
      const j = await DK.Api.post('submitMessage', d);
      form.reset();
      show(j.message || 'Pesan terkirim.', 'ok');
      DK.toast('Pesan terkirim!');
    } catch (e) {
      show(e.message, 'error'); DK.toast(e.message, 'error');
    }
    btn.disabled = false; btn.innerHTML = old;
  };

  // ---------- Beranda ----------
  function heroTitle(t) {
    const w = String(t).split(' ');
    if (w.length < 3) return esc(t);
    const k = w.length >= 5 ? 3 : 2;
    return esc(w.slice(0, -k).join(' ')) + ' <span class="grad">' + esc(w.slice(-k).join(' ')) + '</span>';
  }

  DK.renderHome = async function () {
    const rid = DK.routeId;
    DK.renderPublic(skeletonHome());
    const ok = await DK.loadPublic();
    if (rid !== DK.routeId) return;
    if (!ok) return DK.renderPublic(errorBox());

    const s = settings(), prods = S.pub.produk;
    const promo = prods.filter(function (p) { return p.hargaCoret > p.harga; }).length;
    const wa = DK.waLink(s.WHATSAPP, 'Halo, saya ingin konsultasi tentang produk digital.');
    const art = (prods.slice(0, 3)).map(function (p, i) {
      return '<div class="hero-mini m' + i + '"><div class="hm-img">' + DK.thumb(p) + '</div><div><b class="clamp1">' + esc(p.nama) + '</b><span>' + rupiah(p.harga) + '</span></div></div>';
    }).join('') || '<div class="hero-mini m0"><div><b>Katalog segera hadir</b><span>Produk akan tampil di sini</span></div></div>';

    const hero =
      '<section class="hero-bg"><div class="wrap hero">' +
        '<div class="hero-text"><span class="pill-note"><i class="dot"></i> Katalog Produk Digital</span>' +
        '<h1>' + heroTitle(s.HERO_JUDUL) + '</h1><p class="lead">' + esc(s.HERO_DESKRIPSI) + '</p>' +
        '<div class="hero-btns"><button class="btn btn-primary" data-action="scroll" data-target="katalog">' + ic('search', 16) + ' Jelajahi Katalog</button>' +
        '<button class="btn btn-ghost" data-action="scroll" data-target="kontak">' + ic('chat', 16) + ' Konsultasi Cepat</button></div>' +
        '<div class="stats"><div class="stat"><b class="c-primary">' + prods.length + '</b><span>Produk Digital Aktif</span></div>' +
        '<div class="stat"><b class="c-tert">' + (S.pub.kategori || []).length + '</b><span>Kategori</span></div>' +
        '<div class="stat"><b class="c-amber">' + promo + '</b><span>Produk Promo</span></div></div></div>' +
        '<div class="hero-art" aria-hidden="true"><div class="art-glow"></div>' + art + '</div>' +
      '</div></section>';

    const search =
      '<section class="wrap"><div class="card pad searchbar">' +
        '<div class="row-search"><div class="inp grow">' + ic('search', 18) + '<input id="q" type="search" placeholder="Cari template, e-book, script, desain..." value="' + esc(S.q) + '"></div>' +
        '<label class="sort"><span class="muted small">Urutkan:</span><select id="sort">' +
          [['terbaru', 'Terbaru'], ['murah', 'Harga Terendah'], ['mahal', 'Harga Tertinggi'], ['nama', 'Nama A–Z']].map(function (o) {
            return '<option value="' + o[0] + '"' + (S.sort === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
          }).join('') + '</select></label></div>' +
        '<div id="chips" class="chips"></div></div></section>';

    const katalog =
      '<section id="katalog" class="wrap section"><div class="sec-head"><div><h2>Katalog Produk</h2>' +
      '<p class="muted">Pilih produk digital yang sesuai kebutuhan Anda.</p></div><span class="pill-count" id="count"></span></div>' +
      '<div id="grid" class="grid-products"></div></section>';

    const cara =
      '<section id="cara" class="wrap section"><div class="how card pad">' +
        '<div class="center"><span class="eyebrow">CARA PEMESANAN</span><h2>Mudah, dalam 3 langkah</h2></div>' +
        '<div class="grid3 mt20">' +
          [['search', 'Pilih Produk', 'Telusuri katalog, gunakan pencarian atau filter kategori, lalu buka halaman detail produk.'],
           ['cart', 'Beli atau Tanya', 'Klik "Beli Sekarang" menuju halaman pembelian, atau kirim formulir jika ingin memesan manual/bertanya dulu.'],
           ['mail', 'Terima Produk', 'Penjual membalas lewat email dengan instruksi dan akses produk sesuai pesanan Anda.']].map(function (x, i) {
            return '<div class="step"><div class="step-ic c' + i + '">' + ic(x[0], 22) + '</div><h3>' + x[1] + '</h3><p class="muted small">' + x[2] + '</p></div>';
          }).join('') +
        '</div></div></section>';

    const kontak =
      '<section id="kontak" class="wrap section"><div class="contact">' +
        '<div class="contact-side"><span class="tag">' + ic('mail', 14) + ' Kontak &amp; Bantuan</span>' +
        '<h2>Pemesanan Manual &amp; Pertanyaan Langsung</h2>' +
        '<p>Ingin memesan secara manual atau punya pertanyaan khusus? Kirim pesan Anda. Penjual menerima notifikasi email dan Anda mendapat tanda terima otomatis.</p>' +
        (wa ? '<a class="btn btn-accent mt16" href="' + esc(wa) + '" target="_blank" rel="noopener">' + ic('chat', 16) + ' Chat via WhatsApp</a>' : '') +
        '</div><div class="contact-form">' + contactForm('', false) + '</div></div></section>';

    DK.renderPublic(hero + search + katalog + cara + kontak);
    DK.paintChips(); DK.paintGrid();
    if (S.pendingScroll) { DK.scrollTo(S.pendingScroll); S.pendingScroll = null; }
  };

  // ---------- Detail produk ----------
  function lines(t) { return String(t || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean); }

  DK.paintTabs = function () {
    const p = DK.detailProduct; if (!p) return;
    const map = { fitur: p.fitur, kompatibilitas: p.kompatibilitas, lisensi: p.lisensi };
    const l = lines(map[S.tab]);
    document.querySelectorAll('.tabs [data-tab]').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === S.tab); });
    const body = document.getElementById('tabbody');
    if (body) body.innerHTML = l.length
      ? '<ul class="checks">' + l.map(function (x) { return '<li>' + ic('checkCircle', 18) + '<span>' + esc(x) + '</span></li>'; }).join('') + '</ul>'
      : '<p class="muted small">Belum ada informasi untuk bagian ini.</p>';
  };

  DK.renderDetail = async function (id) {
    const rid = DK.routeId;
    DK.renderPublic(skeletonHome());
    const ok = await DK.loadPublic();
    if (rid !== DK.routeId) return;
    if (!ok) return DK.renderPublic(errorBox());

    const p = S.pub.produk.filter(function (x) { return x.id === id; })[0];
    if (!p) {
      DK.detailProduct = null;
      return DK.renderPublic('<section class="wrap section"><div class="card pad center"><h2>Produk tidak ditemukan</h2>' +
        '<p class="muted mt8">Produk mungkin sudah tidak tersedia.</p><a class="btn btn-primary mt16" href="#/">Kembali ke katalog</a></div></section>');
    }
    DK.detailProduct = p; S.tab = 'fitur';

    const s = settings();
    const link = DK.safeUrl(p.linkBeli);
    const hemat = p.hargaCoret > p.harga ? Math.round((1 - p.harga / p.hargaCoret) * 100) : 0;
    const wa = DK.waLink(s.WHATSAPP, 'Halo, saya ingin bertanya tentang produk: ' + p.nama);

    const priceBox = '<div class="pricebox"><div><small class="eyebrow">' + (hemat ? 'HARGA PROMO' : 'HARGA') + '</small>' +
      '<div class="price big"><b>' + rupiah(p.harga) + '</b>' + (hemat ? '<s>' + rupiah(p.hargaCoret) + '</s>' : '') + '</div></div>' +
      (hemat ? '<span class="save">Hemat ' + hemat + '%</span>' : '') + '</div>';

    const buy = link
      ? '<a class="btn btn-primary btn-lg block" href="' + esc(link) + '" target="_blank" rel="noopener">' + ic('bolt', 18) + ' Beli Sekarang (Buka Tautan Pembayaran)' + ic('external', 16) + '</a>'
      : '<button class="btn btn-primary btn-lg block" data-action="scroll" data-target="pesan-form">' + ic('chat', 18) + ' Pesan Lewat Formulir</button>';

    const info =
      '<div class="card pad detail-info">' +
        '<span class="chip on static">' + esc(p.kategori || 'Produk') + '</span>' +
        '<h1 class="mt12">' + esc(p.nama) + '</h1><p class="muted prewrap">' + esc(p.deskripsi) + '</p>' +
        priceBox + buy +
        (wa ? '<a class="btn btn-accent btn-lg block mt8" href="' + esc(wa) + '" target="_blank" rel="noopener">' + ic('chat', 18) + ' Tanya Penjual via WhatsApp</a>' : '') +
        '<div class="tabs mt16" role="tablist">' +
          '<button class="on" data-action="tab" data-tab="fitur">Fitur Unggulan</button>' +
          '<button data-action="tab" data-tab="kompatibilitas">Kompatibilitas</button>' +
          '<button data-action="tab" data-tab="lisensi">Lisensi</button></div>' +
        '<div id="tabbody" class="mt12"></div></div>';

    const visual = '<div class="card detail-img">' + DK.thumb(p, 'big') +
      (p.badge ? '<span class="badge-top">' + esc(p.badge) + '</span>' : '') + '</div>';

    const kontak =
      '<section id="pesan-form" class="wrap section"><div class="contact">' +
        '<div class="contact-side"><span class="tag">' + ic('mail', 14) + ' Pemesanan</span>' +
        '<h2>Pemesanan Manual &amp; Pertanyaan Langsung</h2>' +
        '<p>Kirim pesan tentang produk ini. Penjual menerima notifikasi email dan Anda mendapat tanda terima otomatis.</p></div>' +
        '<div class="contact-form">' + contactForm(p.nama, true) + '</div></div></section>';

    DK.renderPublic(
      '<div class="wrap crumbs"><a href="#/">' + ic('home', 14) + ' Beranda</a><span>›</span><span>' + esc(p.kategori || 'Produk') + '</span><span>›</span><b>' + esc(p.nama) + '</b></div>' +
      '<section class="wrap detail">' + visual + info + '</section>' + kontak);
    DK.paintTabs();
    if (S.pendingScroll) { DK.scrollTo(S.pendingScroll); S.pendingScroll = null; }
  };

  DK.scrollTo = function (id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
})();
