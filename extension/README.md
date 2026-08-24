# Extension BlokirJudi

Source extension tanpa build tool. `manifest.json` dipakai Chromium (Chrome, Edge, Brave), sedangkan Firefox memakai `manifest.firefox.json` yang perlu disalin menjadi `manifest.json` ketika packaging.

## Siapkan ikon

File PNG sengaja tidak disimpan di Git. Unduh arsip `blokirjudi-extension-icons.zip` yang disertakan pada release/artifact, lalu ekstrak dari folder ini:

```bash
unzip /lokasi/blokirjudi-extension-icons.zip
```

Setelah diekstrak, pastikan tersedia `icons/icon-16.png`, `icon-32.png`, `icon-48.png`, dan `icon-128.png`. SHA-256 arsip yang dibuat bersama perubahan ini adalah `28485bd1cb3f0e99fb2f57b7b81f89666d6ae72b8e2100ab01937675fdd9c0fc`.

## Coba secara lokal

- **Chromium:** buka `chrome://extensions`, aktifkan Developer mode, lalu **Load unpacked** folder ini.
- **Firefox:** salin `manifest.firefox.json` menjadi `manifest.json`, lalu buka `about:debugging` → **This Firefox** → **Load Temporary Add-on**.

Jangan masukkan domain asli ke `rules/starter.json` tanpa proses review. Daftar utama diambil dari API dan disimpan sebagai dynamic rules oleh browser; riwayat browsing tidak pernah dikirim.

Izin “membaca dan mengubah data di semua situs” dibutuhkan browser agar DNR boleh menghentikan navigasi ke domain blacklist. Implementasi ini tidak memakai content script dan tidak membaca isi, cookie, atau riwayat halaman.
