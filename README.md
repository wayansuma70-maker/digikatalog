# DigiKatalog — Frontend (GitHub Pages)

Website katalog produk digital + panel admin. Frontend statis (HTML/CSS/JS murni),
backend berupa Google Apps Script (REST API JSON) yang terpisah.

## Struktur
```
index.html
css/style.css
js/config.js   ← satu-satunya file yang perlu diedit (GAS_URL)
js/api.js  js/ui.js  js/public.js  js/admin.js  js/app.js
```

## Menjalankan
1. Deploy backend `Kode.gs` sebagai Web App, salin URL `/exec`.
2. Buka `js/config.js`, ganti `ISI_URL_EXEC_DI_SINI` dengan URL tersebut.
3. Push folder ini ke GitHub, aktifkan Pages (lihat `PANDUAN-INSTALASI.md`).

## Alamat halaman (hash routing)
- `#/` beranda katalog · `#/produk/PRD-0001` detail produk
- `#/admin` login → dasbor · `#/admin/produk` · `#/admin/pesan` · `#/admin/sync` · `#/admin/pengaturan`
