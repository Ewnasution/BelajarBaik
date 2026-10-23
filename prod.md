# PRD — Muslim Daily Planner

> **Nama produk sementara:** Muslim Daily Planner  
> **Jenis produk:** Progressive Web App (PWA), mobile-first, offline-first  
> **Versi dokumen:** 1.0  
> **Bahasa antarmuka:** Bahasa Indonesia dan العربية  
> **Zona waktu awal:** `Asia/Jakarta`, dapat mengikuti zona waktu perangkat  
> **Status:** Spesifikasi awal untuk pengembangan

---

## 1. Ringkasan Produk

Muslim Daily Planner adalah aplikasi web untuk membantu seorang Muslim menyusun rutinitas ibadah, kebiasaan baik, aktivitas harian, dan keuangan pribadi dalam satu tempat. Aplikasi dirancang agar tetap dapat dibuka dan digunakan tanpa koneksi internet, dengan seluruh data pengguna disimpan secara lokal pada perangkat.

Produk ini bukan aplikasi sosial dan tidak mewajibkan akun daring. Login awal hanya berfungsi untuk mengenali profil lokal yang telah didefinisikan dalam berkas JavaScript. Data tidak otomatis tersinkronisasi ke server atau perangkat lain.

### Prinsip produk

1. **Ibadah sebagai prioritas:** rutinitas ibadah utama mudah dilihat dan dicentang.
2. **Offline-first:** tugas, catatan, dan transaksi tetap tersedia tanpa jaringan.
3. **Ringkas untuk ponsel:** aksi utama dapat dilakukan dengan satu tangan.
4. **Mendorong konsistensi, bukan rasa bersalah:** analitik menampilkan kemajuan secara suportif, tanpa menghakimi pengguna.
5. **Privasi lokal:** data tetap berada pada browser/perangkat, kecuali pengguna mengekspornya sendiri.
6. **Fleksibel:** target dan rutinitas dapat disesuaikan dengan kondisi serta pilihan pengguna.

## 2. Tujuan dan Ukuran Keberhasilan

### Tujuan

- Memudahkan pengguna meninjau dan menuntaskan rutinitas harian.
- Mengingatkan pengguna tentang waktu salat serta puasa sunah.
- Membantu pengguna membangun kebiasaan melalui ringkasan harian, pekanan, dan bulanan.
- Membantu pengguna mencatat pemasukan, pengeluaran tetap, dan pengeluaran harian.
- Berfungsi dengan andal saat offline setelah aplikasi dan aset awal berhasil dimuat.

### Indikator keberhasilan produk

- Pengguna dapat mencentang atau membatalkan tugas tanpa jaringan.
- Data tetap ada setelah halaman ditutup dan dibuka kembali pada browser yang sama.
- Ringkasan analitik diperbarui setelah tugas atau transaksi berubah.
- Pengguna dapat membuat, mengedit, dan menghapus tugas tambahan.
- Pengguna dapat mengekspor cadangan dan memulihkannya melalui impor.
- Seluruh layar utama dapat digunakan pada lebar ponsel mulai sekitar 360 px tanpa gulir horizontal.

## 3. Target Pengguna dan Skenario Utama

### Target pengguna

Muslim yang ingin membangun jadwal harian teratur, menjaga rutinitas ibadah, mengelola kebiasaan pribadi, serta merencanakan keuangan sederhana.

### Skenario utama

1. Pengguna membuka aplikasi, memilih profil lokal, kemudian masuk ke dashboard.
2. Pengguna melihat tanggal Hijriah sebagai tanggal utama dan tanggal Masehi kecil di bawahnya.
3. Pengguna melihat waktu salat hari ini, lalu mencentang salat yang telah dikerjakan.
4. Pengguna mencatat target membaca Al-Qur'an dan progres halaman.
5. Aplikasi menampilkan pengingat puasa sunah Senin-Kamis dan Ayyamul Bidh sesuai tanggal Hijriah.
6. Pengguna menambahkan tugas kesehatan, produktivitas, olahraga, atau islami.
7. Pengguna melihat statistik konsistensi dan meninjau catatan harian.
8. Pengguna mencatat uang masuk dan pengeluaran, kemudian melihat saldo serta proyeksi pengeluaran bulanan.
9. Semua aktivitas tersebut dapat dilakukan tanpa koneksi internet.

## 4. Ruang Lingkup

### Termasuk dalam versi pertama (MVP)

- Login profil lokal berdasarkan data yang ditetapkan di JavaScript.
- PWA dengan cache aset dan penyimpanan data lokal.
- Dashboard tanggal Hijriah/Masehi dan ringkasan harian.
- Checklist ibadah default.
- Pengaturan target halaman Al-Qur'an per hari.
- Perhitungan jadwal salat berdasarkan lokasi dan metode yang dipilih.
- Pengingat kalender puasa sunah dalam aplikasi.
- CRUD (buat, baca, ubah, hapus) tugas tambahan dengan empat kategori.
- Catatan harian serta analitik kebiasaan harian, pekanan, dan bulanan.
- Pencatatan pemasukan, pengeluaran tetap, dan pengeluaran manual.
- Analitik keuangan dan perkiraan pengeluaran bulanan.
- Bahasa Indonesia dan Arab.
- Ekspor/impor data lokal sebagai cadangan.

### Tidak termasuk dalam MVP

- Sinkronisasi lintas perangkat atau penyimpanan cloud.
- Pengiriman notifikasi server, WhatsApp, atau email.
- Integrasi rekening bank, dompet digital, atau pembayaran otomatis.
- Akun daring dengan autentikasi server.
- Klaim bahwa status checklist membuktikan suatu ibadah telah dilakukan; checklist adalah catatan pribadi pengguna.
- Fatwa atau penetapan kalender Hijriah resmi. Aplikasi hanya menyediakan estimasi kalender dengan pengaturan penyesuaian.

## 5. Arsitektur dan Persyaratan Offline

### Pendekatan teknis

Gunakan arsitektur **frontend-only PWA** untuk MVP:

- HTML, CSS, dan JavaScript atau framework frontend pilihan tim.
- `Service Worker` untuk cache app shell, berkas CSS/JS, ikon, font, dan pustaka lokal yang dibutuhkan.
- `IndexedDB` sebagai penyimpanan utama data terstruktur.
- `localStorage` hanya untuk preferensi ringan, misalnya bahasa terakhir atau status tampilan; jangan jadikan penyimpanan transaksi utama.
- Seluruh library runtime yang kritis untuk offline harus dibundel secara lokal, bukan diambil dari CDN saat aplikasi digunakan.
- `manifest.webmanifest` agar aplikasi dapat dipasang sebagai PWA.

### Ketentuan offline

1. Pada pemakaian pertama, koneksi internet diperlukan untuk membuka dan menyimpan aset aplikasi ke cache.
2. Setelah instalasi/cache awal berhasil, halaman utama dan fitur inti harus dapat dijalankan tanpa internet.
3. Seluruh perubahan data disimpan ke IndexedDB segera setelah aksi pengguna dilakukan.
4. UI memberikan indikator status **Offline / Online** yang tidak menghalangi penggunaan.
5. Jika penyimpanan gagal atau ruang perangkat tidak tersedia, tampilkan pesan yang jelas dan jangan menampilkan perubahan seolah-olah sudah tersimpan.
6. Saat aplikasi diperbarui, cache lama dikelola dengan versi cache agar perubahan tidak menyebabkan aset campur versi.
7. Data lokal tidak otomatis berpindah ketika browser, profil browser, atau perangkat diganti.

### Keamanan dan batasan penyimpanan

- Karena tidak ada backend, data lokal tidak dienkripsi oleh server dan dapat diakses oleh siapa pun yang memiliki akses ke profil browser/perangkat.
- Berkas `users.js` yang disertakan dalam aplikasi statis dapat dilihat oleh pengguna yang memeriksa kode sumber. Oleh sebab itu, **jangan menyimpan akun rahasia atau password penting di dalamnya**.
- Login lokal hanya digunakan untuk memilih identitas/profil dan memisahkan catatan lokal, bukan sebagai sistem autentikasi keamanan tinggi.
- Sediakan tombol keluar dan penguncian tampilan opsional dengan PIN lokal bila dibutuhkan, tetapi jelaskan bahwa PIN dalam aplikasi tanpa backend bukan perlindungan setara keamanan akun daring.
- Sediakan ekspor data sebagai JSON dan impor dengan validasi skema. Sarankan pengguna menyimpan file cadangan di tempat aman.
- Jangan mengirim lokasi, transaksi, checklist, atau catatan ke layanan eksternal tanpa persetujuan eksplisit.

## 6. Login dan Profil Lokal

### Ketentuan

- Pada kunjungan pertama, tampilkan layar login/pilih profil.
- Daftar profil didefinisikan dalam modul, misalnya `src/data/users.js`.
- Setiap profil memiliki `id` unik dan `displayName`; data autentikasi contoh hanya untuk lingkungan lokal/demonstrasi.
- Pengguna memilih profil dan, bila diaktifkan, memasukkan PIN lokal sederhana.
- Setelah masuk, aplikasi menyimpan `activeUserId` dan menggunakannya sebagai pemisah seluruh record.
- Jika hanya ada satu profil, tetap tampilkan layar masuk pada penggunaan pertama; setelah itu sesi lokal boleh diingat sesuai pengaturan.
- Pengguna dapat keluar dan berganti profil melalui Pengaturan.
- Tidak ada pendaftaran publik, lupa kata sandi melalui email, atau pemulihan akun di server pada versi MVP.

### Contoh struktur `users.js`

```js
export const USERS = [
  {
    id: "user-demo-01",
    displayName: "Pengguna",
    pin: "1234", // Demo saja; jangan dipakai sebagai rahasia produksi.
    enabled: true
  }
];
```

**Catatan implementasi:** karena data ini berada di JavaScript yang dikirim ke browser, PIN contoh dapat dibaca dari source. Untuk penggunaan pribadi, lebih aman menyediakan mekanisme buat profil lokal saat setup pertama dan tidak menganggap PIN lokal sebagai autentikasi yang kuat. Jika diperlukan autentikasi sesungguhnya atau sinkronisasi, buat backend terpisah.

## 7. Navigasi dan Informasi Arsitektur Layar

### Bottom navigation

Gunakan bottom navigation tetap di bawah, mempertimbangkan safe area perangkat dan ruang agar tidak menutupi konten. Lima menu utama:

1. **Beranda** — ringkasan tanggal, salat, checklist, dan progres hari ini.
2. **Rutinitas** — checklist ibadah dan seluruh tugas tambahan.
3. **Keuangan** — saldo, pemasukan, pengeluaran, dan anggaran.
4. **Analitik** — statistik kebiasaan dan keuangan.
5. **Pengaturan** — bahasa, lokasi/metode salat, target Al-Qur'an, tema, dan cadangan data.

Gunakan label teks kecil bersama ikon, bukan ikon saja. Tab aktif harus jelas melalui warna, indikator, dan aksesibilitas. Tombol aksi penting tidak boleh hanya dapat dijangkau dengan gesture tersembunyi.

### Layar pendukung

- Login / pilih profil.
- Detail tugas dan formulir tugas baru.
- Tambah transaksi.
- Rincian hari (checklist dan catatan).
- Kalender Hijriah dengan penanda puasa sunah.
- Pengelolaan pengeluaran tetap.
- Ekspor/impor dan konfirmasi hapus data.

## 8. Design System dan UI/UX

### Arah visual

- Nuansa tenang, bersih, dan profesional dengan identitas Islami yang tidak berlebihan.
- Warna primer: emerald/hijau sage.
- Latar utama: putih atau krem lembut; teks utama berkontras tinggi.
- Warna status: hijau untuk selesai, amber untuk perlu perhatian, merah untuk aksi destruktif atau kesalahan.
- Gunakan kartu dengan radius moderat, pemisah halus, ruang antar elemen cukup, dan elevasi yang ringan.
- Hindari ornamen yang mengurangi keterbacaan checklist atau angka keuangan.

### Mobile-first

- Rancang mulai dari lebar 360–390 px, lalu adaptasikan ke tablet/desktop.
- Target area sentuh ideal minimal 44 × 44 px.
- Form menggunakan label yang jelas, keypad numerik untuk nominal dan halaman, serta validasi dekat dengan field terkait.
- Tombol checklist mudah disentuh; status selesai tetap terbaca tanpa mengandalkan warna saja.
- Gunakan skeleton atau indikator proses hanya saat diperlukan; semua perubahan lokal harus terasa segera.
- Hormati `prefers-reduced-motion` dan sediakan fokus keyboard yang terlihat.
- Dashboard mengutamakan informasi hari ini; detail lengkap tersedia pada layar masing-masing.

### Dukungan bahasa Arab dan RTL

- Bahasa dipilih pada Pengaturan: **Indonesia** atau **العربية**.
- Saat Arab dipilih, antarmuka menggunakan `dir="rtl"` dan layout yang sesuai, bukan sekadar menerjemahkan teks.
- Ikon navigasi dan arah panah harus mengikuti konteks RTL; angka nominal dan input teknis dapat tetap menggunakan arah LTR bila lebih jelas.
- Simpan preferensi bahasa agar tetap dipakai setelah aplikasi dimuat ulang dan saat offline.
- Semua teks antarmuka berasal dari berkas terjemahan, bukan hard-coded dalam komponen.
- Gunakan font yang mendukung aksara Arab dan harakat secara baik; bundel font lokal jika lisensi mengizinkan.

## 9. Tanggal Hijriah dan Masehi

### Tampilan

- Tanggal **Hijriah** menjadi informasi utama dengan ukuran lebih besar.
- Tanggal Masehi ditempatkan di bawahnya dalam ukuran lebih kecil dan warna sekunder.
- Contoh format:
  - `١٢ ربيع الآخر ١٤٤٨ هـ` (utama pada bahasa Arab)
  - `Jumat, 23 Oktober 2026` (sekunder)
- Nama hari, bulan, dan angka menyesuaikan bahasa yang dipilih.

### Aturan kalender

- Pilih satu pustaka kalender Hijriah yang dapat dijalankan offline dan bundel bersama aplikasi.
- Kalender hasil perhitungan merupakan estimasi; awal bulan dapat berbeda berdasarkan metode hisab/rukyat atau otoritas setempat.
- Sediakan opsi **Penyesuaian Hijriah: -2 sampai +2 hari**.
- Penyesuaian memengaruhi label Hijriah dan pengingat Ayyamul Bidh, tetapi jangan mengubah tanggal Masehi sistem.
- Gunakan zona waktu lokal perangkat secara konsisten.
- Tampilkan tanggal yang sedang dipilih untuk melihat checklist tanggal lampau atau mendatang, tanpa mengubah tanggal sistem perangkat.
- Hindari mengklaim tanggal Hijriah sebagai penetapan resmi.

## 10. Fitur 1 — Dashboard Beranda

Dashboard menjadi ringkasan tindakan yang paling penting untuk hari ini.

### Komponen

1. Tanggal Hijriah utama dan tanggal Masehi sekunder.
2. Sapaan yang netral dan ringkasan hari.
3. Kartu waktu salat berikutnya, jam salat hari ini, serta status lokasi/metode.
4. Ringkasan ibadah: jumlah selesai dari total tugas yang terjadwal.
5. Checklist singkat untuk tugas ibadah utama.
6. Pengingat puasa sunah jika relevan hari ini atau segera datang.
7. Target membaca Al-Qur'an: target halaman, halaman selesai, dan sisa target.
8. Ringkasan keuangan: saldo periode, pemasukan, serta pengeluaran bulan berjalan.
9. Pintasan tambah tugas, catatan harian, pemasukan, dan pengeluaran.

### Perilaku

- Pengguna dapat mencentang tugas dari dashboard tanpa harus membuka layar Rutinitas.
- Dashboard otomatis memperbarui progres setelah perubahan berhasil tersimpan.
- Tampilkan keadaan kosong yang membantu pengguna memulai jika belum ada catatan atau transaksi.

## 11. Fitur 2 — Checklist Ibadah Default

Checklist default dibuat otomatis untuk setiap tanggal lokal. Setiap item dapat dicentang, dibatalkan, dan dilihat status waktunya.

### Daftar default

1. Salat Subuh.
2. Salat Zuhur.
3. Salat Asar.
4. Salat Magrib.
5. Salat Isya.
6. Salat rawatib.
7. Zikir pagi.
8. Zikir petang.
9. Salat Duha.
10. Membaca Al-Qur'an.
11. Zikir sebelum tidur.

### Aturan checklist

- Lima salat fardu tampil sebagai item terpisah beserta perkiraan waktunya.
- Salat rawatib dapat berupa satu checklist harian dengan opsi rincian jumlah/rakaat di pengaturan lanjutan.
- Zikir pagi dan petang merupakan dua item terpisah.
- Salat Duha dan zikir sebelum tidur bersifat fleksibel; tidak perlu dianggap terlewat hanya karena belum ditandai.
- Setiap item menyimpan tanggal, waktu perubahan terakhir, status selesai, dan sumber template.
- Pengguna dapat membatalkan centang dengan konfirmasi ringan bila sudah lama atau bila tidak sengaja; hindari dialog berulang yang menghambat penggunaan.
- Status tidak otomatis dicentang oleh timer atau notifikasi.
- Item harian dibuat berdasarkan tanggal lokal, bukan 24 jam bergulir sejak aplikasi dibuka.
- Riwayat hari lampau tetap dapat dilihat dan diedit. Perubahan template default hanya berlaku untuk hari berikutnya, kecuali pengguna memilih menerapkannya ke hari yang belum memiliki data.

### Target Al-Qur'an

- Pengaturan target halaman per hari dengan nilai awal yang dapat diedit, misalnya 2 halaman.
- Nilai target berupa bilangan bulat positif.
- Pada checklist membaca Al-Qur'an, sediakan aksi `+1 halaman`, input jumlah halaman selesai, dan pilihan progres manual.
- Simpan `targetPages` dan `completedPages` per tanggal.
- Progres dibatasi agar tidak negatif; jika melebihi target, tampilkan progres lebih dari 100% tanpa error.
- Target dapat diubah di Pengaturan; perubahan target baru berlaku ke hari berikutnya dan tidak menghapus histori.
- MVP tidak mengklaim halaman yang dicatat selalu sesuai mushaf yang digunakan; angka adalah catatan pengguna.

## 12. Fitur 3 — Jadwal Salat Berdasarkan Lokasi

### Tujuan

Memberi perkiraan waktu salat harian menggunakan koordinat pengguna, zona waktu, dan metode perhitungan yang dapat dipilih.

### Setup lokasi

- Saat pertama kali dibuka, jelaskan mengapa lokasi diperlukan sebelum meminta izin lokasi browser.
- Sediakan tiga cara:
  1. Gunakan lokasi perangkat (Geolocation API).
  2. Pilih kota secara manual dari daftar lokal jika tersedia.
  3. Masukkan koordinat lintang dan bujur secara manual.
- Simpan koordinat dan label lokasi di IndexedDB setelah persetujuan pengguna.
- Jangan meminta lokasi terus-menerus. Sediakan tombol untuk memperbarui lokasi secara manual.
- Jika izin ditolak atau tidak ada sinyal lokasi, jangan menghambat aplikasi; izinkan input manual dan tampilkan bahwa jadwal mungkin belum tersedia.
- Geolocation browser biasanya mensyaratkan HTTPS atau konteks aman; kebutuhan ini harus ditulis pada dokumentasi deployment.

### Pengaturan jadwal

- Metode perhitungan dipilih dari daftar metode yang didukung pustaka yang digunakan.
- Pengaturan tambahan dapat meliputi mazhab/metode Asar, sudut fajar/isya, dan offset menit untuk tiap waktu jika didukung pustaka.
- Nilai default harus jelas dan dapat diganti pengguna; jangan diam-diam menganggap satu metode cocok untuk seluruh wilayah.
- Jadwal dihitung secara lokal berdasarkan koordinat, tanggal, zona waktu, dan metode.
- Tampilkan lima waktu: Subuh, Zuhur, Asar, Magrib, Isya.
- Kartu `Salat berikutnya` menghitung waktu tersisa dari jam perangkat dan berganti setelah waktu salat terlewati.
- Jadwal dihitung ulang saat tanggal lokal berubah, lokasi/metode berubah, atau pengguna meminta perhitungan ulang.

### Offline dan notifikasi

- Perhitungan waktu salat harus tetap berfungsi offline jika pustaka dan data yang dibutuhkan telah dibundel.
- MVP menggunakan pengingat dalam aplikasi ketika aplikasi terbuka.
- Notifikasi web lokal dapat dijadikan fitur lanjutan setelah dukungan browser/perangkat diuji; jangan menjanjikan notifikasi presisi saat aplikasi ditutup karena perilaku PWA berbeda antarplatform.
- Jangan mengklaim waktu hasil perhitungan adalah keputusan keagamaan resmi; berikan label metode dan opsi penyesuaian.

## 13. Fitur 4 — Pengingat Puasa Sunah

### Jenis pengingat

- Puasa Senin.
- Puasa Kamis.
- Ayyamul Bidh: tanggal 13, 14, dan 15 Hijriah setiap bulan, berdasarkan kalender yang aktif dan penyesuaian Hijriah.

### UI dan perilaku

- Tampilkan pengingat pada dashboard jika hari ini adalah hari puasa sunah atau pengingat untuk hari berikutnya.
- Tampilkan daftar tanggal mendatang pada kalender.
- Sediakan penanda `Direncanakan`, `Dilaksanakan`, dan `Dilewati` sebagai catatan pribadi yang opsional.
- Jangan menganggap pengguna wajib berpuasa; gunakan bahasa netral seperti “Pengingat puasa sunah”.
- Untuk Ayyamul Bidh, tanggal mengikuti konfigurasi kalender Hijriah dan harus menampilkan catatan bahwa tanggal dapat berbeda menurut otoritas setempat.
- Pengguna dapat mematikan setiap kategori pengingat.
- Reminder dihitung lokal tanpa memerlukan API eksternal.

## 14. Fitur 5 — Tugas Tambahan

### Kategori tetap

1. **Islami**
2. **Kesehatan**
3. **Produktivitas**
4. **Olahraga**

Pengguna dapat membuat banyak tugas tambahan dan memilih kategori, judul, deskripsi opsional, jadwal, pengulangan, pengingat dalam aplikasi, dan prioritas.

### Atribut tugas

- Judul (wajib).
- Kategori (wajib, salah satu kategori tetap).
- Catatan/deskripsi (opsional).
- Tanggal tugas (wajib untuk tugas satu kali).
- Waktu (opsional).
- Pola pengulangan: tidak berulang, harian, pekanan pada hari tertentu, atau bulanan.
- Prioritas: biasa atau penting.
- Aktif/nonaktif.
- Status selesai per tanggal.

### Operasi

- Buat, lihat, edit, arsipkan, dan hapus tugas.
- Tugas yang diarsipkan tidak muncul pada daftar aktif, tetapi riwayat selesai tetap dipertahankan.
- Hapus tugas meminta konfirmasi dan tidak boleh menghapus transaksi atau data lain.
- Tugas berulang dibuat sebagai instance harian/pekanan tanpa menghasilkan duplikat jika aplikasi dibuka berkali-kali.
- Checklist tugas tambahan terpisah dari checklist ibadah default, tetapi keduanya dapat dijumlahkan di analitik.
- Filter berdasarkan kategori, tanggal, status, dan prioritas.

## 15. Fitur 6 — Catatan Harian

- Pengguna dapat menulis refleksi singkat untuk setiap tanggal.
- Catatan dapat berisi teks biasa; tidak perlu format kaya pada MVP.
- Catatan disimpan offline dan dapat diedit kapan pun.
- Tampilkan catatan dari detail tanggal, bukan seluruh teks pada dashboard.
- Catatan bersifat privat pada browser lokal; berikan pengingat bahwa ekspor JSON akan menyertakan catatan jika pengguna memilih mencadangkan seluruh data.
- Sediakan batas panjang yang wajar, misalnya 5.000 karakter per tanggal, dan validasi di UI.

## 16. Fitur 7 — Analitik Kebiasaan

### Periode

- Harian.
- Pekanan (Senin–Ahad atau konfigurasi awal pekan yang ditetapkan secara konsisten; default Senin).
- Bulanan (bulan Masehi sebagai basis agregasi, dengan label rentang Hijriah bila relevan).

### Metrik utama

- Persentase tugas terjadwal yang diselesaikan.
- Jumlah checklist selesai dibanding total checklist yang relevan.
- Konsistensi salat fardu berdasarkan centang pengguna.
- Jumlah hari target Al-Qur'an tercapai dan total halaman yang dicatat.
- Penyelesaian rutinitas tambahan per kategori.
- Tren 7 hari dan perbandingan periode berjalan dengan periode sebelumnya.
- Rangkaian hari aktif (*streak*) boleh ditampilkan sebagai motivasi opsional; tidak boleh menjadi satu-satunya ukuran keberhasilan.

### Definisi perhitungan

- `completionRate = completedEligibleItems / totalEligibleItems × 100`.
- Item yang belum jatuh tempo atau tidak dijadwalkan tidak masuk denominator.
- Jika belum ada item yang relevan, tampilkan “Belum ada data” dan bukan 0%.
- Jangan menghitung tugas masa depan sebagai kegagalan.
- Analitik harus dapat dibuka tanpa jaringan dan diperbarui dari data lokal.
- Tampilkan grafik sederhana yang dapat dibaca di layar kecil, ditambah angka dan ringkasan teks agar informasi tidak hanya bergantung pada warna/grafik.

### Keterangan harian, pekanan, dan bulanan

Setiap periode memiliki ringkasan otomatis berdasarkan data, misalnya: jumlah tugas selesai, persentase penyelesaian, target Al-Qur'an, kebiasaan dengan konsistensi tertinggi, serta area yang dapat diperbaiki. Hindari membuat klaim psikologis atau penilaian moral. Gunakan template ringkasan yang transparan, bukan AI/cloud.

## 17. Fitur 8 — Keuangan Pribadi

### Ringkasan keuangan

- Saldo periode: total pemasukan minus total pengeluaran pada periode yang dipilih.
- Total pemasukan bulan ini.
- Total pengeluaran bulan ini.
- Pengeluaran tetap yang akan datang.
- Perkiraan total pengeluaran sampai akhir bulan.
- Grafik ringkas pengeluaran menurut kategori dan tren bulanan.

### A. Input uang masuk

Field:

- Nominal (wajib, lebih besar dari 0).
- Tanggal (default hari ini).
- Sumber pemasukan (wajib; contoh: gaji, usaha, hadiah, lainnya).
- Catatan (opsional).
- Jenis: pemasukan.

### B. Pengeluaran tetap

Pengguna dapat membuat tagihan/pengeluaran rutin, seperti biaya makan, transportasi, sewa, internet, pendidikan, atau kebutuhan lain.

Field:

- Nama pengeluaran (wajib).
- Nominal (wajib, lebih besar dari 0).
- Kategori (wajib; pengguna dapat memilih kategori yang disediakan dan menambah kategori jika disetujui ruang lingkup).
- Frekuensi: mingguan, bulanan, atau tahunan.
- Tanggal mulai dan opsional tanggal berakhir.
- Tanggal jatuh tempo atau hari dalam bulan.
- Status aktif/nonaktif.
- Catatan (opsional).

Aturan:

- Pengeluaran tetap masuk ke perkiraan berdasarkan kejadian yang jatuh dalam periode.
- Buat catatan pembayaran aktual secara terpisah dari template berulang agar pengeditan nominal tagihan tidak mengubah transaksi lampau.
- Sistem tidak melakukan pembayaran otomatis.
- Jika tanggal jatuh tempo tidak ada pada bulan tertentu (misalnya tanggal 31), gunakan hari terakhir bulan tersebut untuk peristiwa bulan itu dan dokumentasikan perilaku ini.

### C. Input pengeluaran manual

Field:

- Nominal (wajib, lebih besar dari 0).
- Tanggal (default hari ini).
- Kategori (wajib).
- Keterangan (wajib atau opsional sesuai desain; disarankan wajib agar mudah ditinjau).
- Catatan (opsional).

Pengeluaran manual dapat diedit dan dihapus dengan konfirmasi. Perubahan transaksi harus langsung memperbarui saldo dan analitik.

### D. Kategori keuangan

Kategori awal yang disarankan:

- Kebutuhan harian.
- Makanan.
- Transportasi.
- Hunian dan tagihan.
- Pendidikan.
- Kesehatan.
- Ibadah/sedekah.
- Hiburan.
- Lain-lain.

Jika kategori kustom dikembangkan, sediakan pengelolaan kategori yang tidak merusak riwayat transaksi ketika nama kategori diubah atau kategori dinonaktifkan.

### E. Analitik dan perkiraan bulanan

- Filter rentang tanggal dan bulan.
- Ringkasan pemasukan, pengeluaran aktual, sisa saldo, dan pengeluaran tetap.
- Grafik pengeluaran berdasarkan kategori.
- Perbandingan pengeluaran bulan ini dengan bulan sebelumnya.
- Perkiraan total pengeluaran bulan ini dihitung dari pengeluaran aktual hingga hari ini ditambah komitmen pengeluaran tetap yang masih akan jatuh tempo hingga akhir bulan.
- Jelaskan asumsi proyeksi; jangan menyamarkan proyeksi sebagai saldo bank atau prediksi pasti.
- Jika belum cukup data transaksi, tampilkan perkiraan berbasis pengeluaran tetap dan beri label “data masih terbatas”.
- Semua nominal menggunakan mata uang IDR sebagai default; sediakan format lokal `id-ID`.
- Gunakan integer rupiah untuk penyimpanan nominal MVP agar menghindari error floating point.

### Rumus proyeksi dasar

`Proyeksi pengeluaran bulan ini = pengeluaran aktual dari awal bulan sampai hari ini + pengeluaran tetap terjadwal yang belum dibayar dan jatuh tempo hingga akhir bulan.`

Jika aplikasi menambahkan estimasi pengeluaran variabel dari pola historis, tampilkan sebagai komponen terpisah beserta metode perhitungannya. Jangan menjumlahkan transaksi yang sudah dibayar dua kali dengan template pengeluaran tetap.

## 18. Pengaturan

### Bahasa

- Indonesia.
- العربية (seluruh antarmuka beralih ke RTL).

### Pengaturan ibadah

- Target halaman Al-Qur'an per hari.
- Metode perhitungan jadwal salat.
- Mazhab/metode Asar jika didukung library.
- Offset menit tiap waktu salat.
- Lokasi tersimpan dan cara memperbarui lokasi.
- Penyesuaian tanggal Hijriah -2 sampai +2 hari.
- Hidup/matikan pengingat puasa Senin, Kamis, dan Ayyamul Bidh.

### Pengaturan aplikasi

- Bahasa.
- Tema terang/gelap/sistem (jika disertakan dalam MVP).
- Hari pertama pekan.
- Mata uang (default IDR; opsi dapat ditunda jika produk hanya untuk Indonesia).
- Status penggunaan offline.
- Ekspor data, impor data, dan hapus seluruh data lokal.
- Profil lokal aktif dan tombol keluar.
- Nomor versi aplikasi.

### Hapus dan pulihkan data

- Hapus seluruh data memerlukan konfirmasi yang jelas dan tindakan kedua.
- Impor file harus memvalidasi versi skema, struktur, tipe data, dan ukuran.
- Tawarkan pilihan gabung atau ganti seluruh data. Pilihan ganti seluruh data harus menampilkan peringatan bahwa data lokal sekarang akan ditimpa.
- Buat cadangan sebelum migrasi skema saat memungkinkan.

## 19. Struktur Data yang Disarankan

Gunakan `userId` pada setiap record untuk memisahkan profil lokal.

### `users`

```ts
type User = {
  id: string;
  displayName: string;
  enabled: boolean;
  createdAt: string;
};
```

Data sumber di `users.js` hanya untuk profil yang telah ditetapkan. Informasi profil aktif disimpan sebagai preferensi lokal.

### `settings`

```ts
type UserSettings = {
  userId: string;
  language: "id" | "ar";
  hijriOffsetDays: number;
  quranTargetPages: number;
  locationLabel?: string;
  latitude?: number;
  longitude?: number;
  prayerMethod: string;
  asrMethod?: string;
  prayerOffsetsMinutes?: Record<string, number>;
  enableMondayFastReminder: boolean;
  enableThursdayFastReminder: boolean;
  enableAyyamulBidhReminder: boolean;
  weekStartsOn: 0 | 1;
  currency: "IDR";
};
```

### `dailyItems`

```ts
type DailyItem = {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD dalam tanggal lokal
  templateKey: string;
  titleSnapshot: string;
  category: "ibadah" | "kesehatan" | "produktivitas" | "olahraga";
  completed: boolean;
  completedAt?: string;
  targetPages?: number;
  completedPages?: number;
  notes?: string;
  source: "default" | "custom";
};
```

### `taskTemplates`

```ts
type TaskTemplate = {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: "islami" | "kesehatan" | "produktivitas" | "olahraga";
  scheduleType: "once" | "daily" | "weekly" | "monthly";
  scheduleConfig?: Record<string, unknown>;
  time?: string;
  priority: "normal" | "important";
  active: boolean;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
};
```

### `dailyNotes`

```ts
type DailyNote = {
  id: string;
  userId: string;
  date: string;
  content: string;
  updatedAt: string;
};
```

### `fastingEntries`

```ts
type FastingEntry = {
  id: string;
  userId: string;
  gregorianDate: string;
  hijriDateLabel: string;
  type: "monday" | "thursday" | "ayyamul_bidh";
  status: "planned" | "completed" | "skipped";
  notes?: string;
};
```

### `transactions`

```ts
type Transaction = {
  id: string;
  userId: string;
  type: "income" | "expense";
  amount: number; // integer dalam rupiah
  date: string; // YYYY-MM-DD
  categoryId: string;
  title: string;
  note?: string;
  recurringExpenseId?: string;
  createdAt: string;
  updatedAt: string;
};
```

### `recurringExpenses`

```ts
type RecurringExpense = {
  id: string;
  userId: string;
  title: string;
  amount: number;
  categoryId: string;
  frequency: "weekly" | "monthly" | "yearly";
  startDate: string;
  endDate?: string;
  dueDay?: number;
  dueDate?: string;
  active: boolean;
  note?: string;
  createdAt: string;
  updatedAt: string;
};
```

### Prinsip penyimpanan

- Gunakan UUID atau ID unik yang tidak bertabrakan.
- Simpan waktu dengan format ISO 8601 dan tanggal tugas sebagai tanggal lokal `YYYY-MM-DD` untuk menghindari masalah pergantian hari.
- Definisikan indeks IndexedDB untuk `userId`, tanggal, kategori, dan jenis transaksi sesuai kebutuhan query.
- Tentukan aturan migrasi `schemaVersion`.
- Jangan menyimpan nilai saldo sebagai satu-satunya sumber kebenaran; hitung saldo dari transaksi agar konsisten.
- Validasi semua data saat ditulis maupun dibaca dari file impor.

## 20. Aturan Bisnis Lintas Fitur

1. Semua data operasional bersifat per profil lokal.
2. Tanggal harian mengikuti zona waktu perangkat saat record dibuat; riwayat tidak boleh bergeser hanya karena perhitungan UTC.
3. Checklist harian dan transaksi menggunakan tanggal yang eksplisit.
4. Data tidak dihapus otomatis hanya karena bulan berganti.
5. Analitik berasal dari record checklist dan transaksi, bukan angka statistik yang ditulis terpisah secara manual.
6. Template pengeluaran tetap berbeda dari transaksi pembayaran aktual.
7. Item yang dijadwalkan di masa depan bukan tugas yang gagal.
8. Aplikasi tetap dapat digunakan tanpa izin lokasi; hanya fitur waktu salat berbasis koordinat yang memerlukan konfigurasi lokasi.
9. Semua keputusan kalender dan jadwal salat dapat ditinjau melalui pengaturan metode.
10. Pesan kesalahan harus menjelaskan tindakan yang dapat dilakukan pengguna.

## 21. Aksesibilitas, Kinerja, dan Reliabilitas

### Aksesibilitas

- Kontras teks dan latar memadai.
- Setiap tombol memiliki nama aksesibel.
- Status checklist dibaca oleh screen reader.
- Warna bukan satu-satunya penanda status.
- Semua alur utama bisa dinavigasi dengan keyboard.
- Perubahan bahasa memperbarui `lang` dan `dir` dokumen.

### Kinerja

- Utamakan pemuatan app shell dengan cepat pada perangkat menengah ke bawah.
- Hindari framework/library berukuran besar jika tidak diperlukan.
- Grafik analitik boleh menggunakan pustaka ringan yang dibundel lokal.
- Jangan meminta jaringan pada setiap pembukaan dashboard.
- Gunakan paginasi atau query berbatas tanggal bila riwayat data membesar.

### Reliabilitas

- Simpan setiap perubahan transaksi/checklist segera setelah aksi.
- Sediakan indikator tersimpan/gagal tersimpan bila operasi membutuhkan waktu.
- Tangani IndexedDB yang tidak tersedia atau ditolak browser dengan pesan yang dapat ditindaklanjuti.
- Uji kehilangan koneksi, refresh, tutup-buka browser, pergantian bahasa, dan perubahan tanggal.
- Aplikasi sebaiknya mendukung instalasi pada browser berbasis Chromium dan Safari iOS modern, dengan dokumentasi perbedaan dukungan PWA.

## 22. Kriteria Penerimaan (Acceptance Criteria)

### Login dan profil

- [ ] Pengguna yang belum memiliki sesi lokal melihat layar masuk/pilih profil.
- [ ] Profil berasal dari modul JavaScript yang ditetapkan.
- [ ] Data dua profil berbeda tidak tercampur.
- [ ] Pengguna dapat keluar dan memilih profil lain.

### Offline

- [ ] Sesudah aset awal tersimpan, aplikasi membuka dashboard tanpa internet.
- [ ] Checklist, tugas, catatan, dan transaksi dapat dibuat/diedit/dihapus offline.
- [ ] Data tetap ada setelah refresh dan browser dibuka kembali.
- [ ] Status offline terlihat dan aplikasi tidak terus mencoba memuat fitur inti dari CDN.
- [ ] Ekspor dan impor berjalan tanpa server.

### Bahasa dan tanggal

- [ ] Pengaturan bahasa beralih antara Indonesia dan Arab.
- [ ] Bahasa Arab mengaktifkan RTL secara benar di seluruh layar utama.
- [ ] Tanggal Hijriah tampil lebih menonjol daripada tanggal Masehi.
- [ ] Penyesuaian Hijriah mengubah label tanggal dan penanda Ayyamul Bidh secara konsisten.
- [ ] UI menyatakan bahwa tanggal Hijriah merupakan estimasi sesuai metode yang dipilih.

### Checklist ibadah dan jadwal salat

- [ ] Semua checklist default tersedia per hari.
- [ ] Status checklist tersimpan dan dapat ditinjau pada tanggal lampau.
- [ ] Target halaman Al-Qur'an dapat diubah dan progres dicatat.
- [ ] Jadwal salat dihitung berdasarkan koordinat, tanggal, zona waktu, dan metode terpilih.
- [ ] Jika lokasi tidak tersedia, pengguna dapat mengatur koordinat/kota secara manual.
- [ ] Waktu salat dan hitung mundur berubah ketika waktu atau tanggal berubah.

### Puasa sunah dan tugas tambahan

- [ ] Pengingat Senin-Kamis dan Ayyamul Bidh tampil sesuai konfigurasi kalender.
- [ ] Pengguna dapat menandai direncanakan, dilaksanakan, atau dilewati.
- [ ] Pengguna dapat membuat, mengedit, mengarsipkan, serta menghapus tugas tambahan.
- [ ] Kategori tugas tambahan tersedia: Islami, Kesehatan, Produktivitas, Olahraga.
- [ ] Tugas berulang tidak menghasilkan duplikasi saat aplikasi dibuka berulang kali.

### Analitik kebiasaan

- [ ] Tersedia tampilan harian, pekanan, dan bulanan.
- [ ] Persentase dihitung dari tugas relevan dan tidak memasukkan tugas yang belum jatuh tempo.
- [ ] Periode tanpa data menampilkan pesan yang tepat, bukan angka 0% yang menyesatkan.
- [ ] Ringkasan berubah setelah checklist diperbarui.

### Keuangan

- [ ] Pengguna dapat mencatat pemasukan, pengeluaran tetap, dan pengeluaran manual.
- [ ] Nominal divalidasi agar tidak negatif atau nol.
- [ ] Saldo dan ringkasan bulan berjalan diperbarui setelah transaksi berubah.
- [ ] Proyeksi bulanan membedakan transaksi aktual dengan pengeluaran tetap yang belum dibayar.
- [ ] Pengeluaran tetap tidak dihitung dua kali ketika pembayaran aktual telah dicatat.
- [ ] Semua transaksi tersedia saat offline dan ikut dalam cadangan data.

## 23. Prioritas Pengembangan

### P0 — Wajib untuk MVP

- PWA + Service Worker + IndexedDB.
- Login/pemilihan profil lokal berbasis `users.js`.
- Navigasi bawah mobile-first.
- Bahasa Indonesia dan Arab/RTL.
- Tanggal Hijriah dan Masehi.
- Checklist ibadah default dan target halaman Al-Qur'an.
- Pengaturan lokasi dan perhitungan waktu salat.
- Pengingat puasa Senin-Kamis dan Ayyamul Bidh.
- Tugas tambahan dengan empat kategori.
- Catatan harian.
- Analitik kebiasaan sederhana harian/pekanan/bulanan.
- Pencatatan transaksi dan pengeluaran tetap.
- Analitik/proyeksi keuangan.
- Ekspor dan impor JSON.

### P1 — Penyempurnaan setelah MVP

- Notifikasi lokal dengan deteksi dukungan browser yang benar.
- Tema terang/gelap/sistem.
- Detail rakaat rawatib dan ringkasan bacaan zikir yang dapat disesuaikan.
- Grafik analitik lanjutan.
- Kategori keuangan kustom.
- Penguncian aplikasi dengan PIN lokal sebagai penghalang akses sederhana.
- Widget dashboard yang dapat disusun ulang.

### P2 — Pertimbangan masa depan

- Sinkronisasi terenkripsi lintas perangkat melalui backend.
- Autentikasi pengguna yang sesungguhnya.
- Cadangan terenkripsi dengan kata sandi.
- Integrasi kalender perangkat jika diperlukan.

## 24. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Akun di JavaScript mudah dibaca | Login lokal disalahartikan sebagai keamanan kuat | Nyatakan batasan; jangan simpan rahasia; sediakan backend jika perlu autentikasi serius |
| Data browser terhapus | Catatan dan transaksi hilang | Ekspor/impor JSON dan pengingat cadangan yang tidak mengganggu |
| Perbedaan kalender Hijriah | Pengingat Ayyamul Bidh dapat bergeser | Penyesuaian -2 hingga +2 hari; tampilkan metode dan disclaimer |
| Perbedaan metode waktu salat | Jadwal berbeda dari rujukan lokal | Pilihan metode, offset manual, label metode yang aktif |
| Izin lokasi ditolak | Waktu salat tidak dapat dihitung otomatis | Pilihan lokasi/kordinat manual dan penggunaan aplikasi selain fitur lokasi tetap berjalan |
| Browser membatasi PWA/notifikasi | Pengingat latar tidak konsisten | MVP menyediakan pengingat saat aplikasi terbuka; dokumentasikan kompatibilitas |
| Profil atau tanggal tercampur | Statistik salah | Semua record memiliki `userId` dan tanggal lokal; uji pergantian profil/zona waktu |
| Pengeluaran tetap terhitung ganda | Proyeksi keuangan menyesatkan | Pisahkan template berulang dari transaksi aktual dan definisikan aturan proyeksi |

## 25. Rekomendasi Struktur Proyek

Contoh struktur frontend yang dapat disesuaikan dengan framework pilihan:

```text
muslim-daily-planner/
├── public/
│   ├── icons/
│   ├── manifest.webmanifest
│   └── offline.html
├── src/
│   ├── data/
│   │   └── users.js
│   ├── i18n/
│   │   ├── id.js
│   │   └── ar.js
│   ├── db/
│   │   ├── indexedDB.js
│   │   └── migrations.js
│   ├── services/
│   │   ├── prayerTimes.js
│   │   ├── hijriCalendar.js
│   │   ├── analytics.js
│   │   ├── finance.js
│   │   └── backup.js
│   ├── components/
│   ├── screens/
│   │   ├── Login/
│   │   ├── Home/
│   │   ├── Routines/
│   │   ├── Finance/
│   │   ├── Analytics/
│   │   └── Settings/
│   ├── styles/
│   └── app.js
├── service-worker.js
└── README.md
```

Struktur ini merupakan rekomendasi, bukan kewajiban. Pastikan pustaka kalender, waktu salat, ikon, dan font yang diperlukan tersimpan secara lokal serta lisensinya sesuai.

## 26. Definisi Selesai (Definition of Done)

Fitur dianggap selesai bila:

- Fungsional sesuai acceptance criteria.
- Berfungsi dengan sentuhan pada ponsel dan navigasi keyboard dasar.
- Terjemahan Indonesia dan Arab lengkap untuk seluruh alur yang dirilis.
- Alur utama berfungsi offline setelah cache awal.
- Data tersimpan di IndexedDB dan lolos uji refresh/tutup-buka.
- Validasi form, pesan kosong, pesan gagal, dan konfirmasi tindakan destruktif tersedia.
- Penghitungan tanggal, jadwal salat, analitik, dan proyeksi keuangan memiliki uji unit untuk kasus batas.
- Ada README berisi cara menjalankan, cara build/deploy HTTPS, penjelasan akun lokal, cara backup/restore, dan batasan offline.
- Tidak ada data pengguna yang dikirim ke server tanpa persetujuan yang jelas.

---

## Catatan Akhir

Prioritaskan pengalaman harian yang sederhana: buka aplikasi, pahami tanggal dan agenda, centang aktivitas, catat transaksi seperlunya, lalu tinjau perkembangan. Hindari menjadikan jumlah checklist sebagai ukuran kesalehan atau keberhasilan pribadi. Aplikasi harus menjadi alat bantu yang fleksibel, bukan sumber tekanan.
