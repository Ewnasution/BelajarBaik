# Pemeriksaan revisi Yawm

Tanggal: 23 Oktober 2026. Revisi mengikuti sembilan permintaan pengguna; spesifikasi lama yang berbeda telah digantikan oleh perilaku berikut.

## Hasil per permintaan

1. Target Al-Qur’an: perubahan pengaturan memperbarui hari ini dan hari mendatang yang sudah dibuka; halaman tercatat dan target hari lampau tetap ada. Target dan progres per tanggal bisa diedit. Checkbox membaca pada habit tracker mengikuti progres halaman.
2. Lima salat wajib hanya menjadi jadwal, tanpa checkbox atau hitungan kebiasaan. Riwayat lama dipertahankan di `legacyPrayerItems`.
3. Kegiatan kalender, pengingat sebelum mulai, panel pengingat aktif, dan kegiatan terdekat tersedia di Beranda.
4. Beranda tidak memiliki elemen checkbox. To-do memakai tombol status selesai/belum selesai.
5. Kartu dan angka keuangan dihapus dari Beranda; halaman Keuangan tetap tersedia.
6. Tujuh tanggal pekanan memakai angka Hijriah utama, dapat dipilih, dan menampilkan penanda jumlah kegiatan, termasuk tanggal yang belum dibuka.
7. To-do harian dapat ditambah, diedit, dihapus dengan konfirmasi, serta ditandai selesai/belum selesai.
8. Habit tracker terpisah menyediakan kebiasaan manual dan bawaan, edit/hapus/arsip, status per tanggal, dan matriks pekanan. Status to-do tidak otomatis mencentang kebiasaan yang bernama sama.
9. Kalender, pemilih tanggal formulir, pengulangan bulanan baru, periode keuangan, dan analitik bulanan memakai Hijriah. Masehi tampil sebagai keterangan sekunder dan tetap digunakan untuk format penyimpanan ISO. Jatuh tempo tagihan tetap mempertahankan siklus Masehi yang dijelaskan pada formulir.

## Otomatis

`npm test`: **20 pengujian lulus**. Pengujian mencakup tanggal/zona waktu, salat lokal, target/progres Al-Qur’an, migrasi data lama, konversi Hijriah dua arah beserta offset dan bulan 29/30 hari, penanda agenda tanpa membuka tanggal, pengingat yang melewati tengah malam, status kegiatan/kebiasaan yang terpisah, penghapusan template yang menjaga riwayat dan keuangan, periode keuangan Hijriah, pemulihan lintas profil, validasi cadangan, dan kontras.

`npm run build`: **berhasil**. Aplikasi menghasilkan shell PWA dan service worker berversi, sekitar 39 KB JavaScript dan 10 KB CSS setelah gzip. Tidak ada dependensi baru atau layanan eksternal yang ditambahkan.

## Browser

Pemeriksaan dilakukan pada Chromium lokal dengan data pengujian terpisah dari origin aplikasi pengguna:

- Beranda mempunyai nol checkbox dan nol kartu saldo.
- Target per tanggal diubah menjadi 5 halaman dengan progres 3; tampil 3/5 (60%). Menandai kebiasaan membaca membuat progres 5/5. Mengubah target umum menjadi 7 langsung menampilkan 5/7 dan tidak menghapus halaman.
- To-do berhasil dibuat, diedit, dan ditandai selesai.
- Kegiatan Kajian pekanan dipilih pada tanggal 13 Hijriah, disimpan ke tanggal yang benar, ditandai di strip pekanan, dan muncul di kegiatan terdekat.
- Pengingat kegiatan yang dimulai lima menit lagi tampil sebagai panel aktif di Beranda.
- Kebiasaan manual berhasil dibuat, diedit, dan ditandai. Kebiasaan bawaan juga dapat diedit tanpa gagal menyimpan.
- Lima layar utama memakai Arab/RTL dan ukuran teks 140% pada viewport 360 px; seluruhnya tidak melebihi lebar halaman.
- Cadangan sintetis skema v1 dipulihkan lewat formulir impor. Ekspor berikutnya menghasilkan skema v2, tujuh kebiasaan, dua kegiatan, dan lima item riwayat salat wajib yang dipertahankan dalam cadangan. Halaman Kebiasaan mempunyai tujuh checkbox dan nol checkbox salat wajib.
- Setelah indikator Aset offline siap, server dimatikan. Aplikasi dapat dimuat ulang, to-do baru ditambahkan dan tetap ada setelah muat ulang berikutnya, kalender Hijriah dibuka, serta jadwal salat dihitung dari pilihan kota manual tanpa server.
- Tidak ada error aplikasi di console selama pemeriksaan produksi.

Pratinjau: `artifacts/yawm-beranda-v2.jpg` dan `artifacts/yawm-habits-v2.jpg`.

## Batas verifikasi

Safari/iOS, instalasi pada perangkat fisik, izin geolokasi nyata, dan kondisi kuota storage penuh belum diuji langsung. Pengingat bekerja saat aplikasi terbuka; notifikasi ketika aplikasi ditutup belum tersedia. Gunakan satu tab aktif untuk mengedit profil yang sama, karena penggabungan perubahan serentak lintas tab belum diterapkan. Pemeriksaan penghapusan memakai data terisolasi di pengujian unit, tanpa menghapus data pengguna lewat browser.
