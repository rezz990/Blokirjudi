# Extension BlokirJudi

Source extension tanpa build tool. `manifest.json` dipakai Chromium (Chrome, Edge, Brave), sedangkan Firefox memakai `manifest.firefox.json` yang perlu disalin menjadi `manifest.json` ketika packaging.

Karena extension sengaja tanpa build tool, file `.env` tidak dibaca oleh browser. URL API bawaan ada di `src/config.js`; pengguna juga bisa menggantinya lewat halaman **Pengaturan** tanpa mengubah source. Untuk deployment, samakan nilai tersebut dengan `API_BLACKLIST_URL` di `.env.example` root.

## Ikon

Ikon utama tersedia sebagai vector di `icons/icon.svg`, jadi tajam di berbagai ukuran dan tetap gampang diedit lewat teks. Nggak ada ZIP atau file PNG binary yang perlu diekstrak dulu.

## Coba secara lokal

- **Chromium:** buka `chrome://extensions`, aktifkan Developer mode, lalu **Load unpacked** folder ini.
- **Firefox:** salin `manifest.firefox.json` menjadi `manifest.json`, lalu buka `about:debugging` → **This Firefox** → **Load Temporary Add-on**.

Jangan masukkan domain asli ke `rules/starter.json` tanpa proses review. Daftar utama diambil dari API dan disimpan sebagai dynamic rules oleh browser; riwayat browsing tidak pernah dikirim.

Izin “membaca dan mengubah data di semua situs” dibutuhkan browser agar DNR boleh menghentikan navigasi ke domain blacklist. Implementasi ini tidak memakai content script dan tidak membaca isi, cookie, atau riwayat halaman.
