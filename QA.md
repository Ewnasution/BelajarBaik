# Pemeriksaan implementasi

Tanggal pemeriksaan: 23 Oktober 2026.

## Otomatis

`npm test`: **12 pengujian lulus**, mencakup pergantian tanggal/zona waktu, tahun kabisat, offset Hijriah, pengingat puasa, tugas berulang tanpa duplikasi, target harian yang tidak mengubah histori, urutan/koreksi salat, pergantian salat ke hari berikutnya, pengecualian tugas mendatang dari analitik, tagihan akhir bulan, pemisahan pembayaran dan template, proyeksi tanpa hitungan ganda, filter periode, validasi cadangan, isolasi profil saat pemulihan, deduplikasi pembayaran saat gabung, serta kontras teks otomatis.

`npm run build`: **berhasil**, menghasilkan app shell, aset lokal, manifest, ikon, dan service worker berversi. Aplikasi JavaScript sekitar 33 KB setelah gzip; CSS sekitar 9 KB setelah gzip.

## Browser

Dilakukan pada browser Chromium di lingkungan desktop:

- Masuk profil lokal; checklist dan tugas harian tambahan tersimpan.
- Buat tugas berulang, pilih kategori, dan centang tugas.
- Simpan catatan harian dan muat ulang.
- Pilih kota Jakarta secara manual dan tampilkan lima waktu salat serta countdown.
- Catat pemasukan Rp1.000.000, tagihan Rp200.000, dan pembayaran aktual. Saldo menjadi Rp800.000; proyeksi Rp200.000, tanpa menghitung tagihan dua kali.
- Ekspor JSON, buka pratinjau impor, dan gabungkan data tanpa menduplikasi transaksi.
- Ganti empat tema, mode gelap, teks 140%, dan Indonesia/Arab dengan RTL.
- Beranda dan keuangan pada viewport 360 px, termasuk angka berisi data dan teks Arab 140%, tidak melampaui lebar halaman. Desktop 1280 px juga diperiksa.
- Kalender Hijriah, status puasa Ayyamul Bidh, dan analitik berjalan dapat dibuka dalam bahasa Arab.
- Filter rentang tanggal mengubah transaksi/saldo periode dan mempertahankan proyeksi bulanan.
- Data profil Pribadi tidak muncul pada profil Keluarga.
- Setelah cache siap, server pratinjau dimatikan. Halaman tetap dapat dimuat ulang, progres Al-Qur’an disimpan, muat ulang berikutnya mempertahankan progres, dan jadwal salat tetap dihitung tanpa server.

Pengujian menemukan dan memperbaiki tabrakan nama kolom ID dengan properti formulir, label tombol ikon, pergeseran fokus checklist, kontras mode gelap, luapan angka keuangan pada teks besar/RTL, dan cache modul dengan respons `Vary: Origin`.

## Batas verifikasi

Safari/iOS, instalasi pada perangkat fisik, geolokasi nyata, kegagalan kuota storage perangkat, dan semua kombinasi tema/zoom belum diuji langsung. Font memakai fallback yang tersedia pada perangkat. Pengingat ketika aplikasi ditutup tidak termasuk fitur yang dijanjikan. Pengeditan simultan profil yang sama di beberapa tab belum menggunakan penggabungan lintas tab; gunakan satu tab aktif per profil.

Pratinjau hasil: `artifacts/sakinah-desktop.jpg`. Data uji hanya dibuat pada origin pratinjau lokal, terpisah dari origin pengembangan.
