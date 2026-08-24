# API BlokirJudi

API ini adalah **Supabase Edge Function** kecil. Hanya domain berstatus `verified` yang keluar; tabel tidak bisa dibaca langsung memakai public key.

## Development

```bash
supabase start
supabase db reset
supabase functions serve blacklist --env-file supabase/.env.local
curl http://127.0.0.1:54321/functions/v1/blacklist
```

Isi `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` di `supabase/.env.local` (jangan pernah commit file itu). Deploy dengan `supabase functions deploy blacklist`. Pasang custom domain/reverse proxy agar endpoint produksi sesuai `https://api.blokirjudi.id/v1/blacklist`.

## Moderasi data

Domain baru masuk sebagai `pending`, lalu moderator mengubahnya menjadi `verified` setelah cek manual. Jangan otomatis menerbitkan laporan komunitas: false positive bisa merugikan pemilik situs yang sah.
