# API BlokirJudi — Supabase + Vercel

API ini sengaja dibuat supaya deployment-nya simpel: **database di Supabase, function di Vercel, tanpa Docker dan tanpa server yang perlu dirawat**. Kamu cukup menjalankan SQL sekali, import repository ke Vercel, isi environment variables, lalu deploy.

Endpoint yang tersedia:

| Endpoint | Fungsi |
| --- | --- |
| `GET /v1/blacklist` | Daftar domain berstatus `verified`. |
| `GET /health` | Mengecek apakah environment wajib sudah terpasang. |

## Arsitektur singkat

```text
Extension → Vercel Function → Supabase REST API → blacklist_domains
```

Service-role key hanya tersimpan sebagai encrypted environment variable di Vercel. Key tersebut tidak pernah dikirim ke extension atau landing page.

## Cara paling simpel: deploy langsung ke Vercel

### 1. Buat project Supabase

1. Masuk ke [Supabase Dashboard](https://supabase.com/dashboard) dan klik **New project**.
2. Tunggu database selesai dibuat.
3. Buka **SQL Editor** → **New query**.
4. Salin seluruh isi [`supabase/migrations/20260824000000_create_blacklist.sql`](supabase/migrations/20260824000000_create_blacklist.sql), lalu klik **Run**.
5. Pastikan tabel `blacklist_domains` muncul di **Table Editor**.

Kamu tidak perlu menginstal Supabase CLI atau Docker untuk alur ini.

### 2. Ambil credential Supabase

Di Supabase Dashboard, buka **Project Settings → Data API / API** dan catat:

- **Project URL**, bentuknya `https://PROJECT_REF.supabase.co`.
- **service_role key** pada bagian API keys.

> `service_role` adalah secret dengan akses tinggi. Masukkan hanya ke Vercel Environment Variables. Jangan tempel di issue, landing, extension, atau variable bernama `PUBLIC_*`.

### 3. Import ke Vercel

1. Push repository ini ke GitHub/GitLab/Bitbucket.
2. Buka [Vercel New Project](https://vercel.com/new), lalu pilih repository BlokirJudi.
3. Pada **Root Directory**, pilih `api`.
4. Framework preset boleh dibiarkan **Other**.
5. Build command dan output directory biarkan kosong; Vercel otomatis menemukan folder `api/` serverless.
6. Tambahkan environment variables berikut:

| Name | Value |
| --- | --- |
| `SUPABASE_URL` | `https://PROJECT_REF.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | service-role key dari Supabase |
| `BLACKLIST_ALLOWED_ORIGIN` | `*` |
| `BLACKLIST_MAX_DOMAINS` | `20000` |
| `BLACKLIST_CACHE_CONTROL` | `public, max-age=300, s-maxage=3600, stale-while-revalidate=86400` |

7. Pilih environment **Production**, **Preview**, dan **Development** bila semuanya memakai database yang sama. Untuk project serius, sebaiknya Preview memakai project Supabase terpisah.
8. Klik **Deploy**.

### 4. Tes deployment

Ganti `DOMAIN-VERCEL` dengan URL hasil deployment:

```bash
curl --fail https://DOMAIN-VERCEL.vercel.app/health
curl --fail https://DOMAIN-VERCEL.vercel.app/v1/blacklist
```

Hasil awal yang normal:

```json
{"version":"2026-08-24","count":0,"domains":[]}
```

Kalau `/health` mengembalikan status `503`, cek lagi nama environment variable di Vercel lalu lakukan **Redeploy**. Perubahan env tidak diterapkan ke deployment lama secara otomatis.

## Hubungkan ke extension

Ada dua pilihan:

1. Buka **Pengaturan** extension dan isi `https://DOMAIN-VERCEL.vercel.app/v1/blacklist`.
2. Untuk nilai bawaan rilis, ubah `DEFAULTS.endpoint` di [`../extension/src/config.js`](../extension/src/config.js).

Kalau sudah punya custom domain seperti `api.blokirjudi.id`, tambahkan melalui **Vercel Project → Settings → Domains**, lalu gunakan:

```text
https://api.blokirjudi.id/v1/blacklist
```

## Menambah dan memoderasi domain

Buka **Supabase → Table Editor → blacklist_domains → Insert row**:

| Field | Contoh |
| --- | --- |
| `domain` | `contoh-judi.test` |
| `status` | `pending` |
| `source` | URL/sumber laporan yang bisa diaudit |
| `notes` | Catatan moderator, tanpa data pribadi |

Alur yang disarankan:

1. Laporan baru masuk sebagai `pending`.
2. Moderator mengecek sumber dan memastikan bukan false positive.
3. Ubah menjadi `verified` agar diterbitkan API, atau `rejected` bila tidak valid.
4. Endpoint hanya mengambil `verified`; `pending` dan `rejected` tidak pernah dikirim.

Gunakan domain `.test` untuk percobaan. Jangan menuduh domain sungguhan tanpa bukti dan review manusia.

## Menjalankan lokal tanpa Docker

Local development hanya membutuhkan Node.js 20+:

```bash
cd api
cp .env.example .env.local
# isi SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY dari project Supabase milikmu
npm run dev
```

Vercel CLI akan menampilkan URL lokal, biasanya `http://localhost:3000`. Tes dengan:

```bash
curl --fail http://localhost:3000/health
curl --fail http://localhost:3000/v1/blacklist
```

Perintah ini memakai database Supabase cloud. Hindari memasukkan data uji ke project production; gunakan project development terpisah kalau memungkinkan.

## Environment variables

Salin dari [`.env.example`](.env.example):

| Variable | Wajib | Keterangan |
| --- | --- | --- |
| `SUPABASE_URL` | Ya | Project URL Supabase, bukan URL Table Editor. |
| `SUPABASE_SERVICE_ROLE_KEY` | Ya | Secret server-only untuk melewati RLS. |
| `BLACKLIST_ALLOWED_ORIGIN` | Tidak | Default `*`, cocok untuk extension lintas browser. |
| `BLACKLIST_CACHE_CONTROL` | Tidak | Aturan cache browser dan Vercel CDN. |
| `BLACKLIST_MAX_DOMAINS` | Tidak | Default dan batas maksimum 20.000. |

Jangan commit `.env.local`; file tersebut sudah masuk `.gitignore`.

## Struktur folder

```text
api/
├── api/
│   ├── _lib/config.js       # validasi env + header bersama
│   ├── health.js            # health check tanpa membocorkan secret
│   └── v1/blacklist.js      # Vercel Function utama
├── supabase/migrations/     # SQL yang dijalankan lewat Supabase SQL Editor
├── .env.example
├── package.json
└── vercel.json              # rewrite URL dan security headers
```

## Update deployment

Setelah commit baru masuk ke branch yang terhubung, Vercel otomatis membuat deployment. Untuk deploy manual dari komputer:

```bash
cd api
npx vercel          # preview
npx vercel --prod   # production
```

## Troubleshooting

- **`/health` status 503** — `SUPABASE_URL` atau `SUPABASE_SERVICE_ROLE_KEY` belum ada; tambahkan di Vercel lalu Redeploy.
- **Blacklist status 502** — cek Vercel Function Logs; biasanya URL/key Supabase salah atau tabel belum dibuat.
- **Respons kosong padahal ada data** — pastikan nilai `status` tepat `verified`.
- **CORS error** — gunakan `BLACKLIST_ALLOWED_ORIGIN=*` untuk extension lintas browser.
- **`FUNCTION_INVOCATION_FAILED`** — pastikan Vercel Root Directory adalah `api` dan Node.js minimal versi 20.
- **Env sudah diganti tetapi belum berubah** — Vercel mengikat env saat build/deploy; lakukan Redeploy.

## Catatan keamanan

- Endpoint tidak menerima write request; hanya `GET` dan `OPTIONS`.
- Query hanya memilih kolom `domain`, bukan sumber/catatan moderator.
- Batas respons dijepit maksimal 20.000 domain walaupun env diisi lebih besar.
- Error publik dibuat generik; detail upstream hanya masuk Vercel logs.
- Rotasi service-role key segera jika pernah bocor.
