# API BlokirJudi — Cloudflare Workers + KV

API ini berjalan di **Cloudflare Workers** dengan **Cloudflare KV** sebagai penyimpanan blacklist. Nggak ada server, Docker, database SQL, atau migration yang perlu dirawat. Worker membaca satu snapshot blacklist dari KV dan extension mengambilnya lewat endpoint publik.

## Stack

| Layer | Teknologi | Kenapa dipilih |
| --- | --- | --- |
| Runtime | Cloudflare Workers | Serverless, tersebar di edge, punya free tier. |
| Language | Vanilla JavaScript | Native Web APIs, tanpa framework/runtime dependency. |
| Database | Cloudflare KV | Cocok untuk blacklist yang sering dibaca dan jarang diubah. |
| Deploy | Wrangler CLI | Login, buat namespace, lalu `wrangler deploy`. |
| Test | Node.js test runner | Cepat dan tanpa library test tambahan. |

> KV bersifat **eventually consistent**. Setelah update, sebagian lokasi edge bisa membutuhkan waktu untuk melihat data terbaru. Ini cocok untuk blacklist harian, tetapi bukan untuk data transaksional real-time.

## Endpoint

| Method dan path | Akses | Fungsi |
| --- | --- | --- |
| `GET /` | Publik | Informasi singkat API. |
| `GET /health` | Publik | Status binding KV dan sumber data aktif. |
| `GET /v1/blacklist` | Publik | Snapshot blacklist untuk extension. |
| `PUT /v1/blacklist` | Bearer token | Mengganti snapshot blacklist di KV. |

## Struktur folder

```text
api/
├── src/
│   ├── index.js          # Router dan handler Worker
│   ├── domain.js         # Normalisasi + validasi domain
│   └── response.js       # JSON, CORS, dan security headers
├── test/
│   └── api.test.js       # Test dengan KV in-memory
├── blacklist.json        # Fallback kalau KV masih kosong/error binding
├── .dev.vars.example     # Contoh secret khusus local development
├── wrangler.toml         # Binding, variable, dan konfigurasi deploy
└── package.json
```

## Prasyarat

- Akun [Cloudflare](https://dash.cloudflare.com/sign-up).
- Node.js 22+ dan npm.
- Git untuk mengambil project.

```bash
node --version
npm --version
```

## Quick start lokal

Semua perintah berikut dijalankan dari folder `api/`:

```bash
cd api
npm install
cp .dev.vars.example .dev.vars
# ganti ADMIN_API_TOKEN di .dev.vars dengan token random milikmu
npm test
npm run dev
```

Wrangler biasanya membuka Worker di `http://localhost:8787`. Coba:

```bash
curl --fail http://localhost:8787/health
curl --fail http://localhost:8787/v1/blacklist
```

Saat KV lokal masih kosong, `/v1/blacklist` otomatis memakai `blacklist.json`. Jadi contributor tetap bisa menjalankan API sebelum membuat namespace Cloudflare.

## Deploy pertama kali

### 1. Install dan login Wrangler

```bash
cd api
npm install
npx wrangler login
npx wrangler whoami
```

Browser akan terbuka untuk otorisasi akun Cloudflare.

### 2. Buat KV namespace

```bash
npx wrangler kv namespace create BLACKLIST_KV
npx wrangler kv namespace create BLACKLIST_KV_PREVIEW
```

Wrangler akan mencetak ID namespace. Salin hasilnya ke `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "BLACKLIST_KV"
id = "ID_NAMESPACE_PRODUCTION"
preview_id = "ID_NAMESPACE_PREVIEW"
```

Namespace juga bisa dibuat dari Cloudflare Dashboard lewat **Workers & Pages → KV → Create namespace**. Yang penting, nama binding di Worker tetap persis `BLACKLIST_KV`.

### 3. Buat admin token

Buat token random minimal 32 byte, misalnya:

```bash
openssl rand -hex 32
```

Simpan sebagai encrypted Worker secret:

```bash
npx wrangler secret put ADMIN_API_TOKEN
```

Tempel token saat Wrangler meminta nilainya. Token tidak ditulis di `wrangler.toml` dan jangan pernah di-commit.

### 4. Atur variable non-secret

Nilai bawaan ada di `wrangler.toml`:

| Variable | Default | Fungsi |
| --- | --- | --- |
| `ALLOWED_ORIGIN` | `*` | CORS untuk extension lintas browser. |
| `CACHE_CONTROL` | cache 5 menit | Cache browser/edge dan stale fallback. |
| `MAX_DOMAINS` | `20000` | Batas snapshot; kode tetap menjepit maksimal 20.000. |

`ADMIN_API_TOKEN` adalah **secret**, bukan `[vars]`. Untuk environment production yang terpisah, tambahkan konfigurasi `[env.production]` dan KV binding terkait sesuai kebutuhan akunmu.

### 5. Test dan deploy

```bash
npm test
npm run deploy
```

Wrangler mencetak URL seperti:

```text
https://blokirjudi-api.USERNAME.workers.dev
```

Tes deployment:

```bash
curl --fail https://blokirjudi-api.USERNAME.workers.dev/health
curl --fail https://blokirjudi-api.USERNAME.workers.dev/v1/blacklist
```

## Mengisi atau mengganti blacklist

`PUT` mengganti snapshot secara atomik. Buat file sementara—jangan taruh token di file JSON:

```json
{
  "version": "2026-08-24.1",
  "domains": [
    "contoh-judi.test",
    "contoh-lain.test"
  ]
}
```

Upload dengan token yang sama seperti secret Worker:

```bash
export BLOKIRJUDI_ADMIN_TOKEN='token-yang-tadi-dibuat'
export BLOKIRJUDI_API_URL='https://blokirjudi-api.USERNAME.workers.dev'

curl --fail --request PUT "$BLOKIRJUDI_API_URL/v1/blacklist" \
  --header "Authorization: Bearer $BLOKIRJUDI_ADMIN_TOKEN" \
  --header "Content-Type: application/json" \
  --data @blacklist-upload.json
```

API akan:

1. menolak request tanpa token;
2. menerima domain atau URL penuh;
3. menghapus `www.`/`*.` dan mengubah huruf menjadi lowercase;
4. membuang nilai invalid;
5. menghapus duplikat dan mengurutkan domain;
6. memotong hasil sesuai `MAX_DOMAINS`; dan
7. menyimpan snapshot pada key `blacklist:current`.

Cek hasilnya dengan `GET /v1/blacklist`. Jangan mengunggah domain sungguhan tanpa bukti dan review manusia. Gunakan `.test` saat development.

## Format respons

```json
{
  "version": "2026-08-24.1",
  "updatedAt": "2026-08-24T18:30:00.000Z",
  "count": 2,
  "domains": ["contoh-judi.test", "contoh-lain.test"]
}
```

Endpoint mengirim `ETag`. Client dapat mengirim `If-None-Match`; jika snapshot belum berubah, Worker membalas `304 Not Modified` tanpa body.

## Fallback blacklist

`blacklist.json` sengaja ikut source sebagai fallback kosong yang aman. Data fallback dipakai ketika:

- binding KV belum tersedia saat local development; atau
- key `blacklist:current` belum pernah dibuat.

Fallback bukan jalur moderasi production. Update production melalui admin endpoint/KV agar tidak membutuhkan deploy ulang. Jangan memasukkan daftar domain besar langsung ke Git.

## Hubungkan extension

Buka **Pengaturan** extension dan isi:

```text
https://blokirjudi-api.USERNAME.workers.dev/v1/blacklist
```

Untuk nilai bawaan release, ubah `DEFAULTS.endpoint` pada `extension/src/config.js`. Kalau menggunakan custom domain, tambahkan route/domain di Cloudflare Workers lalu gunakan misalnya:

```text
https://api.blokirjudi.id/v1/blacklist
```

## Development workflow

```bash
cd api
npm test                    # test handler + KV memory
npm run dev                 # Worker lokal
npm run typecheck           # generate tipe binding Worker
npm run tail                # log Worker production
npm run deploy              # deploy
```

Sebelum pull request, minimal jalankan `npm test` dan `git diff --check`.

## Keamanan dan privasi

- API publik hanya mendukung baca; update membutuhkan Bearer token.
- Token admin disimpan lewat `wrangler secret put`, bukan di repository.
- Worker hanya menyajikan hostname. Ia tidak menerima riwayat browsing pengguna.
- Error publik tidak menampilkan secret atau data internal.
- Response memakai CORS, `nosniff`, `no-referrer`, cache policy, dan ETag.
- Segera rotasi token dengan `wrangler secret put ADMIN_API_TOKEN` jika bocor.
- Untuk moderasi tim yang kompleks, buat pipeline review terpisah; jangan membagikan satu token lewat chat publik.

## Monitoring dan rollback

Lihat log langsung:

```bash
npm run tail
```

Karena update KV mengganti satu snapshot, simpan file input yang sudah direview di tempat privat atau release artifact. Untuk rollback, kirim kembali snapshot versi sebelumnya melalui endpoint `PUT`. Cloudflare juga menyimpan riwayat deployment Worker, tetapi riwayat deployment tidak otomatis mengembalikan isi KV.

## Troubleshooting

- **Wrangler bilang namespace ID invalid** — ganti dua placeholder ID di `wrangler.toml` dengan hasil pembuatan KV.
- **`/health` menampilkan `unbound`** — binding harus bernama persis `BLACKLIST_KV`.
- **API tetap memakai fallback** — KV sudah terhubung tetapi key belum ada; lakukan upload `PUT` pertama.
- **Update status 401** — token di header tidak sama dengan `ADMIN_API_TOKEN` Worker.
- **Update status 503** — KV binding atau admin secret belum dikonfigurasi.
- **Perubahan belum terlihat di lokasi lain** — KV eventually consistent; tunggu propagasi dan perhatikan cache.
- **CORS diblokir** — untuk extension lintas browser, gunakan `ALLOWED_ORIGIN="*"`.
- **Deploy gagal dari CI** — tambahkan `CLOUDFLARE_API_TOKEN` dan `CLOUDFLARE_ACCOUNT_ID` sebagai secret CI, bukan ke source.
