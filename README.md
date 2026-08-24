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

## Mulai development

Mulai dari [`.env.example`](.env.example) untuk checklist URL deployment. API dan landing punya contoh env masing-masing karena keduanya dijalankan oleh service yang berbeda—jangan taruh service role key di env landing.

```bash
# landing
cd landing && cp .env.example .env && npm install && npm run dev

# API (butuh Supabase CLI + Docker)
cd api && cp supabase/.env.example supabase/.env.local
supabase start && supabase db reset

# extension: buka chrome://extensions dan Load unpacked folder extension/
```

Panduan khusus ada di README masing-masing folder. Endpoint produksi dan tautan store/GitHub masih placeholder, jadi wajib disesuaikan sebelum release.

> Ikon extension memakai SVG yang bisa diedit langsung dan tidak memerlukan file ZIP atau asset PNG binary. Detailnya ada di [`extension/README.md`](extension/README.md).

## Ikut kontribusi

Mau memperbaiki typo, aksesibilitas, false positive, dokumentasi, atau fitur baru? Semuanya boleh. Baca [`CONTRIBUTING.md`](CONTRIBUTING.md), buka issue dulu untuk perubahan besar, lalu kirim pull request kecil yang gampang direview.

Blacklist bukan tempat main tuduh. Domain baru harus punya sumber dan melewati review manusia sebelum berstatus `verified`.

## Dukung project

Donasi via **QRIS, GoPay, dan Bank Jago** segera dibuka setelah detail resminya siap. Jangan transfer ke akun yang mengaku tim BlokirJudi sebelum kanal resmi dicantumkan di repo ini.

## Lisensi

Kode dirilis dengan [MIT License](LICENSE). Daftar domain perlu kebijakan data terpisah sebelum dipublikasikan dalam skala besar.
