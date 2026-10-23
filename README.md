# Yawm · Muslim Daily Planner

Implementasi frontend PWA dari `prod.md` dan `design.prod`, memakai JavaScript ES modules, Vite, Adhan, dan IndexedDB. Tidak ada backend, CDN, pelacakan, atau layanan lokasi eksternal.

## Menjalankan

Memerlukan Node.js 22.12+ atau versi LTS yang lebih baru.

```sh
npm install
npm run dev
```

Buka alamat yang dicetak di terminal. Untuk memeriksa PWA dan cache offline, gunakan build produksi:

```sh
npm run build
npm run preview
```

`npm test` menjalankan pengujian perhitungan tanggal, jadwal salat, tugas berulang, analitik, proyeksi keuangan, dan validasi/isolasi cadangan. `npm run build` menghasilkan direktori `dist/`, termasuk service worker dengan daftar aset serta versi hash konten.

## Fitur

- Dua profil lokal terpisah; definisinya ada di `src/data/users.js`. Nama tampilan bisa disesuaikan. Profil lokal adalah pemilihan identitas, bukan autentikasi aman. Tidak ada password rahasia di source.
- Beranda berisi tanggal Hijriah, tujuh tanggal pekanan dengan penanda kegiatan, to-do harian, kegiatan terdekat, jadwal salat, progres Al-Qur’an, dan catatan. Checklist ibadah dan ringkasan keuangan tidak ditampilkan di Beranda. To-do mempunyai tombol status selesai, edit, dan hapus.
- Halaman Kebiasaan menyediakan habit tracker terpisah: enam kebiasaan sunah/zikir/Al-Qur’an sebagai awal, tambah manual, edit, hapus, pengulangan harian/pekanan/bulanan, dan status per tanggal dengan matriks pekanan. Salat wajib hanya berupa jadwal, bukan checklist dan tidak masuk persentase kebiasaan.
- Kegiatan kalender dan to-do mendukung kategori, waktu, prioritas, pengulangan, dan pengingat saat aplikasi terbuka: saat mulai, 15/30 menit, 1 jam, atau 1 hari sebelumnya. Pengingat yang sudah memasuki waktunya muncul sebagai panel di Beranda dan pesan singkat. Kegiatan terdekat dihitung sampai 30 hari mendatang, termasuk tanggal yang belum pernah dibuka.
- Target Al-Qur’an dan jumlah halaman dapat diedit per tanggal melalui Atur progres. Perubahan target umum di Pengaturan langsung berlaku untuk hari ini dan hari mendatang, termasuk tanggal yang pernah dibuka; progres tetap ada dan target hari lampau dipertahankan. Status kebiasaan membaca dan progres halaman selalu disinkronkan.
- Waktu salat dihitung lokal dengan [Adhan](https://github.com/batoulapps/adhan-js), yang ikut dibundel. Lokasi awal kosong; pilih kota lokal, koordinat manual, atau izin geolokasi. Default metode Singapore, Asar standar; tersedia enam metode serta koreksi menit per salat. Periksa kesesuaian dengan rujukan lokal.
- Kalender dan pemilih tanggal memakai Hijriah (`islamic-umalqura` melalui Intl), termasuk kegiatan, kebiasaan, transaksi, periode keuangan, dan analitik bulanan. Tanggal Masehi hanya menjadi keterangan sekunder dan format ISO untuk penyimpanan. Ada penyesuaian −2 hingga +2 hari; tanggal Hijriah yang tidak tersedia ditolak. Kalender menandai kegiatan serta Senin/Kamis/Ayyamul Bidh. Tanggal merupakan estimasi, bukan penetapan resmi.
- Pengulangan bulanan kegiatan/kebiasaan baru mengikuti Hijriah secara default dan menyesuaikan hari terakhir bulan 29/30. Pola Masehi lama dipertahankan saat migrasi dan dapat dipilih pada formulir. Jatuh tempo tagihan bulanan tetap memakai tanggal Masehi 1–31 agar siklus tagihan yang telah dibuat tidak bergeser; keterangannya tersedia di formulir tagihan.
- Transaksi pemasukan/pengeluaran dengan edit/hapus, filter bulan dan rentang tanggal, template tagihan mingguan/bulanan/tahunan, dan pembayaran aktual terpisah. Uang disimpan sebagai integer rupiah. Filter rentang mengubah saldo/transaksi periode; proyeksi tetap merujuk seluruh bulan terpilih.
- Proyeksi = pengeluaran aktual hingga hari ini + tagihan belum dibayar yang jatuh tempo mulai hari ini hingga akhir bulan. Pembayaran terkait memakai pasangan ID template/tanggal kejadian untuk mencegah hitungan ganda. Perubahan template tidak mengubah nominal transaksi lampau.
- Analitik harian/pekanan/bulanan dari data tersimpan, penyelesaian tugas yang sudah relevan, statistik halaman dan catatan, tren, kategori pengeluaran, dan perbandingan bulan sebelumnya. Hari tanpa data ditandai “—”, bukan dianggap nol.
- Indonesia dan Arab/RTL di semua layar serta formulir. Data yang ditulis pengguna tetap dalam bahasa aslinya.
- Empat tema berbasis token CSS: Claymorphism, Neumorphism, Glassmorphism, Skeuomorphism. Mode terang/gelap/sistem, empat warna, font lokal, ukuran teks 85–140%, tinggi baris, kepadatan, dan pengurangan animasi. Pratinjau langsung dengan Terapkan/Batalkan/Reset. Teks dan indikator menyesuaikan kontras warna.
- Ekspor/impor JSON, pratinjau jumlah data, gabung atau ganti, dan hapus profil dengan konfirmasi ketik `HAPUS`.

## Penyimpanan dan cadangan

IndexedDB `yawm-planner` menyimpan satu snapshot terstruktur per `userId` di store `profiles`. Skema data v2 memisahkan `habits` dan `tasks`, dengan status per tanggal dalam `days`. Versi skema v1 dimigrasikan saat dibaca: tugas berulang lama menjadi kebiasaan, dan catatan salat wajib dipertahankan sebagai `legacyPrayerItems` dalam cadangan tanpa menjadi checklist/analitik. Penulisan per profil bersifat atomik dan antre; UI baru memperbarui data setelah transaksi database selesai. `localStorage` hanya menyimpan pilihan profil aktif dan bahasa login.

Ekspor melalui **Pengaturan → Data & cadangan → Ekspor JSON**. Cadangan menyertakan kegiatan, kebiasaan, refleksi, dan keuangan profil aktif; simpan berkas dengan baik. Impor menerima skema v1/v2 hingga 5 MB, termasuk cadangan dengan penanda aplikasi lama `sakinah`, dengan pemeriksaan nilai, tanggal, kategori, warna, profil, dan pembayaran duplikat. Pemulihan selalu menulis ke profil aktif. Gabung mempertahankan pengaturan saat ini; record dengan ID/tanggal sama memakai versi dari cadangan. Ganti menimpa seluruh data profil aktif dan memerlukan penegasan kedua. Profil lain tidak berubah.

Penggantian browser, origin/port, profil browser, penghapusan storage, atau perangkat membuat penyimpanan berbeda. Data tidak otomatis tersinkronisasi. Siapa pun yang dapat membuka profil browser bisa mengakses catatan lokal; offline tidak berarti terenkripsi. Hindari memakai dua tab untuk mengedit profil yang sama bersamaan karena snapshot tab terakhir dapat menimpa perubahan tab lain.

Target Al-Qur’an awal disalin ketika sebuah tanggal pertama kali dibuka. Mengubah target umum memperbarui target mulai hari ini, termasuk tanggal mendatang yang pernah dibuka, tanpa menghapus halaman yang telah dibaca. Target tanggal lampau hanya berubah bila diedit secara eksplisit lewat Atur progres pada tanggal tersebut. Snapshot kebiasaan yang sudah dilakukan dipertahankan ketika template dihapus.

## Deployment dan offline

Unggah seluruh isi `dist/` ke hosting statis pada root domain. Gunakan **HTTPS**; `localhost` adalah pengecualian konteks aman untuk pengembangan. Geolokasi dan service worker memerlukan konteks aman. Jangan membuka `index.html` langsung melalui `file://`. Konfigurasi saat ini memakai path root; hosting subdirektori memerlukan penyesuaian base, scope, dan cache manifest.

Kunjungan awal memerlukan koneksi. Setelah **Pengaturan → Aset offline siap**, seluruh file aplikasi tersedia dari cache, dan checklist, tugas, catatan, transaksi, pengaturan, serta impor/ekspor berfungsi offline. Font memakai font sistem/lokal (Segoe UI, Verdana, Georgia, Tahoma atau fallback), tidak memerlukan unduhan font. Pengembang dapat menambah font berlisensi dengan membundelnya sendiri.

Versi service worker baru menunggu sampai tab versi lama ditutup sehingga cache tidak bercampur. Setelah deployment, tutup semua tab aplikasi lalu buka lagi untuk memakai versi terbaru. Database tidak dihapus saat pembaruan cache. Jika aset awal gagal diunduh, indikator tidak mengklaim offline siap; muat ulang saat tersambung.

Instal dari menu browser **Instal aplikasi / Tambahkan ke layar utama**, atau tombol Pasang aplikasi di Pengaturan. Chromium dan Safari iOS modern berbeda dalam dukungan prompt, instalasi, geolokasi, serta penyimpanan. Pengingat hanya berjalan ketika aplikasi terbuka; aplikasi tidak menjanjikan alarm ketika ditutup atau browser menangguhkan tab.

## Struktur

`src/data/` berisi profil/preset; `src/services/` memisahkan kalender, agenda/pengingat, salat, kebiasaan/analitik, keuangan, migrasi, tampilan, dan cadangan; `src/screens/` memuat Beranda, habit tracker, dan kalender; `src/db.js` menangani IndexedDB; `src/i18n.js` kamus dua bahasa; `src/styles/` token dan primitive visual; `src/app.js` menghubungkan layar, formulir, dan interaksi. `public/` berisi manifest/ikon, `scripts/` generator cache, dan `tests/` pengujian domain.
