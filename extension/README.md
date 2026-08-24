# Extension BlokirJudi

Extension ini **Vanilla JavaScript + Manifest V3**, tanpa npm, bundler, content script, ataupun analytics. Chromium memakai service worker module, sedangkan Firefox memakai background script klasik yang setara.

## Yang perlu disiapkan

- Salah satu browser: Chrome, Edge, Brave, atau Firefox versi modern.
- API blacklist yang sudah berjalan. Ikuti [`../api/README.md`](../api/README.md), atau gunakan endpoint produksi.
- Opsional: Python/Node untuk validasi file sebelum packaging.

Tidak ada `npm install` untuk module ini.

## Struktur penting

| Path | Fungsi |
| --- | --- |
| `manifest.json` | Manifest untuk Chrome, Edge, dan Brave. |
| `manifest.firefox.json` | Manifest khusus Firefox. |
| `src/background.js` | Scheduler dan update blacklist untuk Chromium. |
| `src/background.firefox.js` | Implementasi background tanpa module import untuk Firefox. |
| `src/config.js` | Endpoint API dan interval update bawaan. |
| `popup/` | Ringkasan status dan tombol update manual. |
| `options/` | Pengaturan aktif/nonaktif, URL API, dan interval. |
| `blocked/` | Halaman ramah ketika navigasi ditahan. |
| `rules/starter.json` | Rules statis yang telah direview; default kosong. |

## Atur URL API

Extension tidak membaca `.env` karena source langsung dimuat browser tanpa proses build. Ada dua cara:

1. **Untuk default distribusi:** ubah `DEFAULTS.endpoint` di `src/config.js` agar sama dengan `API_BLACKLIST_URL` pada [`.env.example`](../.env.example).
2. **Untuk development/pengguna:** buka halaman **Pengaturan** extension dan isi URL, misalnya `http://127.0.0.1:54321/functions/v1/blacklist`.

Endpoint wajib mengembalikan salah satu format berikut:

```json
{"domains":["contoh-judi.test"]}
```

atau array langsung:

```json
["contoh-judi.test"]
```

## Load di Chrome, Edge, atau Brave

1. Pastikan `manifest.json` tersedia di root folder `extension/`.
2. Buka halaman extension browser:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
3. Aktifkan **Developer mode**.
4. Klik **Load unpacked / Muat yang belum dipaketkan**.
5. Pilih folder `extension/`, bukan folder repository paling atas.
6. Buka popup BlokirJudi → **Pengaturan**, isi URL API, lalu klik **Simpan**.
7. Tekan **Update sekarang** dan pastikan jumlah situs berubah tanpa pesan error.

Setiap selesai mengedit source, tekan tombol **Reload** pada kartu extension. Perubahan service worker tidak selalu aktif hanya dengan refresh popup.

## Load di Firefox tanpa mengubah file Git

Jangan menimpa manifest Chromium di working tree. Buat salinan sementara:

```bash
cd extension
rm -rf /tmp/blokirjudi-firefox
mkdir -p /tmp/blokirjudi-firefox
cp -R . /tmp/blokirjudi-firefox/
cp manifest.firefox.json /tmp/blokirjudi-firefox/manifest.json
```

Lalu:

1. Buka `about:debugging#/runtime/this-firefox`.
2. Klik **Load Temporary Add-on**.
3. Pilih `/tmp/blokirjudi-firefox/manifest.json`.
4. Buka popup dan isi URL API dari halaman pengaturan.
5. Setelah source berubah, ulangi penyalinan atau tekan **Reload** di `about:debugging`.

Temporary add-on hilang ketika Firefox ditutup; itu normal untuk mode development.

## Skenario uji manual

1. Tambahkan `contoh-judi.test` berstatus `verified` ke Supabase lokal.
2. Arahkan endpoint extension ke API lokal dan tekan **Update sekarang**.
3. Pastikan popup menampilkan jumlah rules dan waktu update.
4. Buka `http://contoh-judi.test`; browser harus diarahkan ke halaman BlokirJudi.
5. Nonaktifkan proteksi lewat pengaturan, lalu pastikan dynamic rules dihapus.
6. Aktifkan lagi dan coba endpoint salah untuk memastikan error tampil tanpa merusak rules/browser.

Gunakan domain `.test` untuk pengujian. Jangan memasukkan domain sungguhan ke `rules/starter.json` tanpa review.

## Validasi sebelum commit

```bash
node --check src/background.js
node --check src/background.firefox.js
node --check src/blacklist.js
node -e "JSON.parse(require('fs').readFileSync('manifest.json')); JSON.parse(require('fs').readFileSync('manifest.firefox.json'))"
python -c "import xml.etree.ElementTree as ET; ET.parse('icons/icon.svg')"
```

## Packaging release

Chromium:

```bash
cd extension
zip -r /tmp/blokirjudi-chromium.zip . -x 'manifest.firefox.json' 'README.md'
```

Firefox:

```bash
cd extension
rm -rf /tmp/blokirjudi-firefox && mkdir /tmp/blokirjudi-firefox
cp -R . /tmp/blokirjudi-firefox/
cp manifest.firefox.json /tmp/blokirjudi-firefox/manifest.json
cd /tmp/blokirjudi-firefox
zip -r /tmp/blokirjudi-firefox.zip . -x 'manifest.firefox.json' 'README.md'
```

Naikkan `version` di kedua manifest secara bersamaan sebelum release.

## Kenapa meminta akses semua situs?

Izin host diperlukan agar `declarativeNetRequest` boleh menghentikan navigasi ke domain blacklist. Extension tidak memasang content script, tidak membaca isi halaman/cookie/history, dan tidak mengirim riwayat browsing. Data lokal yang disimpan hanya pengaturan, cache rules, waktu update, dan pesan error terakhir.

## Troubleshooting

- **Ikon/popup tidak muncul** — pastikan yang dipilih adalah folder `extension/` dan cek error manifest di halaman extension.
- **Update gagal `Failed to fetch`** — cek URL, API, CORS, dan untuk API lokal pastikan Supabase masih hidup.
- **Domain tidak terblokir** — domain harus `verified`; tekan update manual dan reload extension setelah mengubah source.
- **Firefox menolak manifest** — pastikan file sementara bernama persis `manifest.json` dan berasal dari `manifest.firefox.json`.
