# BlokirJudi 🌱

**BlokirJudi** adalah project open source untuk membantu orang menjauh dari situs judi online—tanpa menghakimi, tanpa tracking, dan tanpa menjual data. Masih tahap awal, jadi pintu kontribusi terbuka lebar banget.

## Isi repo

| Folder | Isinya |
| --- | --- |
| [`extension/`](extension/) | Extension Manifest V3 untuk Chrome, Edge, Brave, dan Firefox |
| [`api/`](api/) | Supabase database + Edge Function penyedia blacklist |
| [`landing/`](landing/) | Landing page Astro yang ringan dan responsif |

## Cara kerjanya

1. Extension mengambil daftar domain terverifikasi dari API setiap 24 jam.
2. Domain divalidasi dan disimpan sebagai dynamic rules di browser.
3. `declarativeNetRequest` memblokir navigasi tanpa membaca isi halaman.
4. Cuma cache blacklist dan pengaturan yang disimpan lokal. Nggak ada riwayat browsing, fingerprint, analytics, atau data pribadi yang dikirim.

Kami memilih DNR karena lebih hemat daripada mencegat semua request lewat JavaScript. API memakai Supabase supaya migrasi, RLS, dan deployment tetap sederhana. Landing memakai Astro tetapi mengirim HTML/CSS biasa; interaksi kecilnya tetap vanilla JavaScript.

## Pilih module yang mau dijalankan

Ketiga module bisa dikembangkan terpisah. Kalau mau mencoba alur penuh, urutan paling enak adalah **API → extension → landing**.

### 1. API blacklist

Butuh Docker dan Supabase CLI. Perintah singkatnya:

```bash
cd api
supabase start
supabase db reset
cp supabase/.env.example supabase/.env.local
supabase functions serve blacklist --env-file supabase/.env.local
```

Nilai URL dan key lokal harus diambil dari `supabase status`, bukan dibiarkan berupa placeholder. Panduan database, data uji, moderasi, deployment, dan troubleshooting ada di **[`api/README.md`](api/README.md)**.

### 2. Browser extension

Module ini tidak membutuhkan npm atau build tool. Jalankan API lebih dulu, lalu buka halaman extension browser dan pilih folder `extension/` lewat **Load unpacked**. Untuk Firefox, gunakan salinan temporary dengan manifest khusus—jangan menimpa manifest Chromium di working tree.

Panduan Chrome/Edge/Brave/Firefox, konfigurasi URL API lokal, skenario test, dan packaging release ada di **[`extension/README.md`](extension/README.md)**.

### 3. Landing page

Butuh Node.js `>=22.12.0`:

```bash
cd landing
npm install
cp .env.example .env
npm run dev
```

Panduan semua environment URL, build, preview, static hosting, dan checklist rilis ada di **[`landing/README.md`](landing/README.md)**.

### Environment

[`.env.example`](.env.example) root adalah checklist URL seluruh deployment. Gunakan file env khusus di module masing-masing saat menjalankan aplikasi. Jangan pernah menaruh `SUPABASE_SERVICE_ROLE_KEY` di landing atau extension karena keduanya dapat dibaca pengguna.

Endpoint produksi dan tautan store/GitHub masih placeholder, jadi wajib disesuaikan sebelum release.

> Ikon extension memakai SVG yang bisa diedit langsung dan tidak memerlukan file ZIP atau asset PNG binary. Detailnya ada di [`extension/README.md`](extension/README.md).

## Ikut kontribusi

Mau memperbaiki typo, aksesibilitas, false positive, dokumentasi, atau fitur baru? Semuanya boleh. Baca [`CONTRIBUTING.md`](CONTRIBUTING.md), buka issue dulu untuk perubahan besar, lalu kirim pull request kecil yang gampang direview.

Blacklist bukan tempat main tuduh. Domain baru harus punya sumber dan melewati review manusia sebelum berstatus `verified`.

## Dukung project

Donasi via **QRIS, GoPay, dan Bank Jago** segera dibuka setelah detail resminya siap. Jangan transfer ke akun yang mengaku tim BlokirJudi sebelum kanal resmi dicantumkan di repo ini.

## Lisensi

Kode dirilis dengan [MIT License](LICENSE). Daftar domain perlu kebijakan data terpisah sebelum dipublikasikan dalam skala besar.
