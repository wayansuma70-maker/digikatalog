// ============================================================
// APP — router (hash) + delegasi event
// ============================================================
(function () {
  const DK = window.DK = window.DK || {};
  const S = DK.S;
  DK.routeId = 0;

  DK.route = function () {
    DK.routeId++;
    DK.closeModal();
    document.body.classList.remove('side-open');
    const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    if (!S.pendingScroll) window.scrollTo(0, 0);
    if (parts[0] === 'admin') return DK.renderAdmin(parts[1] || '');
    if (parts[0] === 'produk' && parts[1]) return DK.renderDetail(decodeURIComponent(parts[1]));
    return DK.renderHome();
  };

  document.addEventListener('click', function (e) {
    if (e.target.classList && e.target.classList.contains('modal-back')) { DK.closeModal(); return; }
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const a = el.dataset.action;
    if (DK.onAdminClick(a, el)) return;

    switch (a) {
      case 'modal-close': DK.closeModal(); break;
      case 'scroll': {
        const t = el.dataset.target;
        if (document.getElementById(t)) DK.scrollTo(t);
        else { S.pendingScroll = t; location.hash = '#/'; }
        break;
      }
      case 'tab': S.tab = el.dataset.tab; DK.paintTabs(); break;
      case 'cat': S.cat = el.dataset.val; DK.paintChips(); DK.paintGrid(); break;
      case 'reset-filter': {
        S.q = ''; S.cat = 'Semua';
        const q = document.getElementById('q'); if (q) q.value = '';
        DK.paintChips(); DK.paintGrid(); break;
      }
      case 'reload-pub': S.pub = null; DK.route(); break;
    }
  });

  document.addEventListener('input', function (e) {
    const t = e.target;
    if (DK.onAdminInput(t)) return;
    if (t.id === 'q') { S.q = t.value; DK.paintGrid(); }
  });

  document.addEventListener('change', function (e) {
    const t = e.target;
    if (DK.onAdminChange(t)) return;
    if (t.id === 'sort') { S.sort = t.value; DK.paintGrid(); }
  });

  document.addEventListener('submit', function (e) {
    const f = e.target, k = f.dataset && f.dataset.form;
    if (!k) return;
    e.preventDefault();
    const h = { contact: DK.submitContact, login: DK.submitLogin, product: DK.submitProduct, settings: DK.submitSettings }[k];
    if (h) h(f);
  });

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') DK.closeModal(); });
  window.addEventListener('hashchange', DK.route);
  document.addEventListener('DOMContentLoaded', DK.route);
})();
