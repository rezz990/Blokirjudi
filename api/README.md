# API BlokirJudi

API ini adalah **Supabase Edge Function** kecil. Hanya domain berstatus `verified` yang keluar; tabel tidak bisa dibaca langsung memakai public key.

## Development

```bash
supabase start
supabase db reset
cp supabase/.env.example supabase/.env.local
# isi semua nilai wajib di supabase/.env.local
supabase functions serve blacklist --env-file supabase/.env.local
curl http://127.0.0.1:54321/functions/v1/blacklist
```

Semua pilihan environment beserta contoh URL ada di [`supabase/.env.example`](supabase/.env.example). Jangan pernah commit `.env.local`. Deploy dengan `supabase functions deploy blacklist`, lalu pasang custom domain/reverse proxy agar endpoint produksinya rapi, misalnya `https://api.blokirjudi.id/v1/blacklist`.

## Moderasi data

Domain baru masuk sebagai `pending`, lalu moderator mengubahnya menjadi `verified` setelah cek manual. Jangan otomatis menerbitkan laporan komunitas: false positive bisa merugikan pemilik situs yang sah.
