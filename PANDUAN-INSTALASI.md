# Panduan Instalasi — DigiKatalog

Arsitektur: **Frontend** di GitHub Pages, **Backend** Google Apps Script (Sheets + Drive + Gmail).
Kerjakan berurutan: A (backend) → B (hubungkan) → C (GitHub Pages).

---

## A. Backend (Google Apps Script)

1. Buka https://script.google.com → **Proyek baru**.
2. Ganti nama file `Code.gs` menjadi `Kode`, hapus isinya, lalu tempel seluruh isi berkas **Kode.gs**. Simpan.
3. Pilih fungsi **setupAppEnvironment** di dropdown → klik ▶ **Run** — **HANYA SEKALI**.
   - Klik *Review permissions* → pilih akun → *Advanced* → *Go to … (unsafe)* → *Allow*.
   - Buka **Execution log**: pastikan muncul ✅ dan alamat Spreadsheet + Folder Drive.
   - Cek Google Drive: folder `📁 DigiKatalog` dan file `🗃️ Database — DigiKatalog` sudah ada.
4. **Atur password admin** (wajib): ikon ⚙️ **Project Settings** → *Script Properties* → *Edit script properties* →
   ubah nilai `ADMIN_PASSWORD` dari `GANTI-PASSWORD-INI` menjadi password Anda → Save.
   Login admin ditolak selama password masih bawaan.
5. **Deploy** → *New deployment* → ikon ⚙️ → **Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Klik **Deploy**, lalu **salin URL** yang berakhiran `/exec`.

> Setiap kali Kode.gs diubah: Deploy → *Manage deployments* → ✏️ → Version: *New version* → Deploy.
> URL `/exec` tetap sama.

---

## B. Hubungkan frontend ke backend

Buka `js/config.js` dan ganti:

```js
GAS_URL: 'ISI_URL_EXEC_DI_SINI'
```
dengan URL `/exec` dari langkah A5 (tetap di dalam tanda kutip).

---

## C. Deploy ke GitHub Pages

> ⚠️ **Folder kerja Git = folder `digikatalog` hasil ekstrak ZIP**, yaitu folder yang
> **langsung berisi `index.html`, `css`, dan `js`**. Jangan masuk lebih dalam, jangan naik satu level.
> Jangan memakai "Upload files" di web GitHub — struktur folder bisa rusak. Gunakan terminal.

1. Pasang Git: Windows https://git-scm.com/download/win · Mac `git --version` · Linux `sudo apt install git`. Cek: `git --version`
2. Buat akun di https://github.com (username jadi bagian URL situs).
3. Atur identitas (sekali saja):
   ```
   git config --global user.name "Nama Anda"
   git config --global user.email "email@akun-github.com"
   ```
4. Di GitHub: **+ → New repository** → beri nama (mis. `digikatalog`) → **Public** →
   **jangan** centang README/.gitignore/license → Create.
5. Buka terminal **di folder `digikatalog`** (Windows: buka folder di File Explorer, klik address bar,
   ketik `powershell`, Enter). Verifikasi dengan `dir` (Windows) atau `ls -la` (Mac/Linux):
   **`index.html` harus terlihat di daftar teratas**, bersama folder `css` dan `js`.
6. Kirim ke GitHub, satu per satu:
   ```
   git init
   git add .
   git commit -m "Upload pertama"
   git branch -M main
   git remote add origin https://github.com/USERNAME/NAMA-REPO.git
   git push -u origin main
   ```
   Saat diminta *Password*, tempel **Personal Access Token** (bukan password akun):
   https://github.com/settings/tokens → *Generate new token (classic)* → centang **repo**.
   Saat mengetik/paste token layar tampak kosong — itu normal.
7. Aktifkan situs: repo → **Settings → Pages** → Source: *Deploy from a branch* →
   Branch **main** / **(root)** → Save → centang **Enforce HTTPS**.
   Tunggu 1–2 menit: `https://USERNAME.github.io/NAMA-REPO/`

### Update di kemudian hari
```
git add .
git commit -m "Deskripsi perubahan"
git push
```
Jika tampilan lama masih muncul: Ctrl+Shift+R.

---

## D. Uji coba

| Uji | Hasil yang diharapkan |
|---|---|
| Buka URL situs | Katalog tampil (3 produk contoh) |
| Kirim formulir di halaman detail | Pesan masuk di sheet `Pesan`, 2 email terkirim |
| Buka `…/#/admin`, login | Dasbor tampil dengan grafik |
| Admin → Tambah Produk + foto | Produk muncul di katalog publik |
| F12 → Console | Tidak ada error CORS |

## E. Masalah umum

| Gejala | Solusi |
|---|---|
| "Backend belum dihubungkan" | `GAS_URL` di `js/config.js` belum diisi / salah |
| "Respons server tidak valid" | Deploy harus *Execute as: Me* + *Anyone*; pakai URL `/exec` |
| Login: "Password admin belum diatur" | Ubah `ADMIN_PASSWORD` di Script Properties |
| Setelah mengedit Sheet manual data lama tampil | Admin → Google Sheets Sync → Bersihkan Cache |
| Foto tidak tampil | Pastikan foto diunggah lewat panel admin (otomatis dibagikan publik) |
| Unggah foto gagal di akun Workspace | Admin domain mungkin melarang berbagi publik; tempel URL foto dari hosting lain |
| 404 di GitHub Pages | `index.html` tidak ada di root repo (folder yang di-push salah) |
| Halaman tanpa styling | Folder `css/` dan `js/` tidak ikut ter-push; push ulang dari terminal |
