# API BlokirJudi

API ini memakai **Supabase Postgres + Edge Function (Deno)**. Database menyimpan antrean moderasi, sedangkan endpoint publik cuma mengembalikan domain dengan status `verified`.

## Yang perlu disiapkan

- [Docker](https://docs.docker.com/get-docker/) aktif.
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) versi terbaru.
- `curl` atau REST client untuk mengetes endpoint.
- Project Supabase hanya diperlukan saat mau deploy; development lokal nggak butuh akun cloud.

Cek instalasi dulu:

```bash
docker --version
supabase --version
docker info >/dev/null && echo "Docker siap"
```

## Menjalankan API lokal dari nol

Semua perintah di bagian ini dijalankan dari folder `api/`.

```bash
cd api

# 1. Nyalakan Postgres, Studio, dan runtime Supabase lokal.
supabase start

# 2. Terapkan ulang seluruh migration ke database lokal.
supabase db reset

# 3. Siapkan konfigurasi fungsi yang tidak masuk Git.
cp supabase/.env.example supabase/.env.local
```

Buka `supabase/.env.local`. Untuk local stack, ambil URL dan service-role key dari:

```bash
supabase status
```

Isi minimalnya seperti ini menggunakan nilai **API URL** dan **service_role key** dari output tersebut:

```dotenv
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=service-role-key-dari-supabase-status
BLACKLIST_ALLOWED_ORIGIN=*
BLACKLIST_MAX_DOMAINS=20000
```

Lalu jalankan Edge Function di terminal yang tetap terbuka:

```bash
supabase functions serve blacklist --env-file supabase/.env.local
```

Tes dari terminal lain:

```bash
curl --fail --verbose \
  http://127.0.0.1:54321/functions/v1/blacklist
```

Respons kosong yang sehat akan terlihat seperti ini:

```json
{"version":"2026-08-24","count":0,"domains":[]}
```

## Menambahkan data untuk pengujian

1. Buka Supabase Studio lokal di `http://127.0.0.1:54323`.
2. Masuk ke **SQL Editor**.
3. Jalankan data contoh berikut. Gunakan domain `.test` supaya tidak menuduh situs sungguhan.

```sql
insert into public.blacklist_domains (domain, status, source, notes)
values ('contoh-judi.test', 'verified', 'local-development', 'Data uji lokal');
```

Panggil endpoint lagi dan pastikan `contoh-judi.test` muncul. Untuk menguji moderasi, ubah status menjadi `pending`; domain itu seharusnya langsung hilang dari respons API.

## Environment variables

| Variable | Wajib | Fungsi |
| --- | --- | --- |
| `SUPABASE_URL` | Ya | URL project/local API Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Ya | Membaca tabel yang dilindungi RLS; **jangan pernah masuk frontend**. |
| `BLACKLIST_ALLOWED_ORIGIN` | Tidak | Origin CORS. Default `*` cocok untuk extension lintas browser. |
| `BLACKLIST_CACHE_CONTROL` | Tidak | Kebijakan cache CDN/browser untuk respons blacklist. |
| `BLACKLIST_MAX_DOMAINS` | Tidak | Jumlah hasil, otomatis dibatasi maksimal 20.000. |

Template lengkapnya ada di [`supabase/.env.example`](supabase/.env.example). File `.env.local` sudah diabaikan Git.

## Deploy ke Supabase

```bash
cd api
supabase login
supabase link --project-ref PROJECT_REF
supabase db push
supabase secrets set BLACKLIST_ALLOWED_ORIGIN='*' BLACKLIST_MAX_DOMAINS='20000'
supabase functions deploy blacklist --no-verify-jwt
```

Pada hosted Edge Function, `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` sudah diinjeksi otomatis oleh Supabase. Jangan mencoba mengunggah ulang dua built-in secret itu dari `.env.local`; perintah `secrets set` di atas hanya untuk konfigurasi tambahan.

Tes URL bawaan setelah deploy:

```bash
curl --fail https://PROJECT_REF.supabase.co/functions/v1/blacklist
```

Extension saat ini memakai URL cantik `https://api.blokirjudi.id/v1/blacklist`. Arahkan custom domain/reverse proxy ke function Supabase, atau ganti endpoint lewat pengaturan extension. Pastikan proxy meneruskan `ETag`, `If-None-Match`, `Cache-Control`, dan request `OPTIONS`.

## Moderasi dan keamanan

- Laporan baru wajib masuk sebagai `pending`, bukan langsung `verified`.
- Simpan sumber yang bisa diaudit dan cek false positive secara manual.
- Jangan masukkan path lengkap, query string, IP pengguna, atau data pribadi—database hanya butuh hostname.
- Jangan pernah memakai service-role key di landing maupun extension.
- Tabel sengaja menolak akses `anon` dan `authenticated`; Edge Function adalah pintu baca publiknya.

## Troubleshooting

- **`Docker is not running`** — nyalakan Docker, lalu ulangi `supabase start`.
- **Respons `500`** — cek terminal function dan pastikan dua variable Supabase tidak masih berupa placeholder.
- **Domain tidak muncul** — pastikan statusnya tepat `verified` dan domain menggunakan huruf kecil.
- **CORS diblokir browser** — untuk development, gunakan `BLACKLIST_ALLOWED_ORIGIN=*`, lalu restart function.
- **Reset total local stack** — jalankan `supabase stop --no-backup`, kemudian `supabase start && supabase db reset`.
