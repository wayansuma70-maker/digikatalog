// ============================================================
// API — komunikasi ke Google Apps Script (fetch, tanpa google.script.run)
// ============================================================
(function () {
  const DK = window.DK = window.DK || {};
  DK.S = DK.S || {};
  const TK = 'dk_admin_token';

  function gasUrl() {
    const u = (window.APP_CONFIG || {}).GAS_URL || '';
    if (!/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(u)) {
      throw new Error('Backend belum dihubungkan. Isi GAS_URL di file js/config.js dengan URL /exec dari Apps Script.');
    }
    return u;
  }

  async function parse(res) {
    const txt = await res.text();
    try { return JSON.parse(txt); }
    catch (e) { throw new Error('Respons server tidak valid. Pastikan Web App di-deploy dengan akses "Anyone" dan URL /exec benar.'); }
  }

  DK.Api = {
    token() { try { return sessionStorage.getItem(TK) || ''; } catch (e) { return ''; } },
    setToken(t) { try { t ? sessionStorage.setItem(TK, t) : sessionStorage.removeItem(TK); } catch (e) {} },

    // GET: data publik
    async get(action, params) {
      const t0 = performance.now();
      const q = new URLSearchParams(Object.assign({ action: action }, params || {}));
      const res = await fetch(gasUrl() + '?' + q.toString());
      const j = await parse(res);
      DK.S.apiMs = Math.round(performance.now() - t0);
      if (!j.success) throw new Error(j.message || 'Gagal memuat data.');
      return j.data;
    },

    // POST: WAJIB text/plain agar tidak memicu CORS preflight yang diblok GAS
    async post(action, data) {
      const t0 = performance.now();
      const res = await fetch(gasUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: action, data: data || {}, token: this.token() })
      });
      const j = await parse(res);
      DK.S.apiMs = Math.round(performance.now() - t0);
      if (j.code === 'AUTH') {
        this.setToken('');
        const e = new Error(j.message || 'Sesi berakhir.'); e.code = 'AUTH'; throw e;
      }
      if (!j.success) { const e = new Error(j.message || 'Terjadi kesalahan.'); e.code = j.code; throw e; }
      return j;
    }
  };
})();
