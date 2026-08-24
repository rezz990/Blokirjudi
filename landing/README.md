# Landing BlokirJudi

Landing memakai **Astro**, tanpa framework UI dan tanpa analytics. Hasil produksinya static HTML/CSS/JavaScript, jadi bisa dipasang di hampir semua static hosting.

## Yang perlu disiapkan

- Node.js `>=22.12.0` (sesuai `package.json`).
- npm yang ikut bersama Node.js.

Cek versi:

```bash
node --version
npm --version
```

Kalau Node terlalu lama, pakai version manager seperti `nvm`, `fnm`, atau `mise` sebelum lanjut.

## Menjalankan dari nol

Semua perintah dijalankan dari folder `landing/`:

```bash
cd landing
npm install
cp .env.example .env
npm run dev
```

Dev server tersedia di `http://localhost:4321`. Sesuai setup repository ini, server juga bisa dijalankan sebagai background process:

```bash
npx astro dev --background
npx astro dev status
npx astro dev logs
npx astro dev stop
```

## Mengatur URL dan tombol

Edit `.env` lokal—jangan edit `.env.example` dengan URL rahasia/pribadi.

| Variable | Dipakai untuk |
| --- | --- |
| `PUBLIC_SITE_URL` | URL canonical deployment (disiapkan untuk konfigurasi hosting/SEO). |
| `PUBLIC_GITHUB_URL` | Tombol menuju source dan kontribusi. |
| `PUBLIC_EXTENSION_DOWNLOAD_URL` | CTA utama **Pasang di browser**. |
| `PUBLIC_CHROME_STORE_URL` | URL store Chrome untuk integrasi tombol store berikutnya. |
| `PUBLIC_FIREFOX_ADDON_URL` | URL Firefox Add-ons. |
| `PUBLIC_EDGE_STORE_URL` | URL Microsoft Edge Add-ons. |
| `PUBLIC_DONATION_URL` | Tombol donasi; kosong berarti tombol tetap nonaktif. |

Semua variable berawalan `PUBLIC_` masuk ke output browser. **Jangan pernah isi token, password, atau Supabase service-role key di sini.** Restart dev server setelah mengubah `.env`.

## Build dan preview produksi

```bash
npm run build
npm run preview
```

- Output production ada di `landing/dist/` dan tidak di-commit.
- Buka URL preview yang dicetak terminal dan cek desktop serta mobile.
- Jalankan build sekali lagi sebelum PR untuk menangkap error template/env.

## Deploy

### Netlify/Vercel/Cloudflare Pages

Gunakan konfigurasi umum berikut:

```text
Root directory: landing
Build command: npm run build
Output directory: dist
Node version: 22
```

Salin variable dari `.env.example` ke dashboard environment hosting. Jangan mengunggah file `.env`.

### Static hosting biasa

```bash
npm ci
npm run build
```

Upload **isi** folder `dist/` ke document root hosting. Pastikan HTTPS aktif.

## Checklist sebelum rilis

- Ganti semua `USERNAME`, `EXTENSION_ID`, dan `ADDON_SLUG` di environment production.
- Pastikan CTA download tidak lagi menuju placeholder.
- Isi `PUBLIC_DONATION_URL` hanya setelah kanal QRIS/GoPay/Bank Jago resmi siap.
- Uji navigasi keyboard, tampilan mobile, dan mode reduced motion.
- Pastikan tidak ada analytics/tracker baru tanpa diskusi komunitas.

## Troubleshooting

- **`npm install` gagal karena versi engine** — gunakan Node `>=22.12.0`.
- **Perubahan `.env` tidak muncul** — stop lalu jalankan ulang dev server.
- **Tombol donasi tetap mati** — pastikan `PUBLIC_DONATION_URL` tidak kosong dan restart server.
- **Port 4321 terpakai** — jalankan `npm run dev -- --port 4322`.
- **Build lama/aneh** — hapus cache dengan `rm -rf .astro dist`, lalu `npm run build`.
