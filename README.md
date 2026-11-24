# Gramedia In-Out: Sistem Presensi & Pencatatan Jam Keluar Masuk Karyawan

Aplikasi berbasis web modern untuk mencatat dan memantau pergerakan jam keluar masuk karyawan, kepatuhan batas waktu istirahat, serta rekapitulasi kehadiran harian dengan fitur ekspor laporan PDF resmi.

---

## Fitur Utama

1. **Autentikasi Administrator (Admin Login)**
   - Akses aman untuk Administrator Gramedia.
   - Kredensial bawaan: `admin@gramedia.com` / `admin123`.
   - Terintegrasi dengan Supabase Auth serta mode offline-first.

2. **Manajemen Data Karyawan (Master Data Karyawan)**
   - CRUD data karyawan: NIP, Nama Lengkap, Departemen/Divisi, Posisi/Jabatan, dan Nomor Kontak.
   - Konfigurasi batas maksimal istirahat (default 60 menit, dapat disesuaikan per karyawan).
   - Pengaturan status aktif / nonaktif.

3. **Pencatatan Jam Keluar Masuk & Deteksi Durasi**
   - Pencatatan jam keluar dengan pilihan keperluan (Istirahat, Tugas Luar, Keperluan Pribadi, Medis).
   - Pencatatan jam kembali / jam masuk.
   - Penghitungan otomatis selisih durasi waktu di luar kantor (contoh: "1 jam 15 menit" atau "75 menit").
   - **Key Feature 1: Sistem Peringatan (Warning Istirahat)**
     - Banner peringatan aktif pada dashboard jika ada karyawan yang sedang keluar melebihi batas waktu istirahat yang ditentukan.
     - Penandaan badge peringatan otomatis pada riwayat log dan laporan bila waktu istirahat melampaui batas toleransi.

4. **Key Feature 2: Daftar Karyawan yang Bekerja Pada Hari Itu**
   - Pemantauan kehadiran shift karyawan harian secara real-time.
   - Status presensi: Bekerja di Kantor, Sedang di Luar (Istirahat/Tugas), atau Selesai Bekerja (Pulang).
   - Jam masuk shift, jam kepulangan, dan riwayat frekuensi keluar hari itu.

5. **Ekspor Laporan Harian Format PDF Resmi**
   - Pembuatan laporan PDF satu-klik menggunakan `jspdf` dan `jspdf-autotable`.
   - Format standar korporat dengan Kop Dokumen Gramedia, ringkasan metrik statistik, tabel daftar hadir harian, tabel rincian keluar-masuk, serta blok tanda tangan Store Manager.

---

## Panduan Desain & Palet Warna (Format 60-30-10)

- **60% Dominan (Latar Belakang & Permukaan)**: Warna pastel lembut `#F4F7FB`, `#FFFFFF`, `#F8FAFC`.
- **30% Struktural (Sidebar, Header, dan Kontur)**: Biru pastel navy `#1E3A5F`, `#274770`, `#E2E8F0`.
- **10% Aksen (Aksi & Peringatan)**: Biru tombol `#2563EB`, amber peringatan `#D97706`, merah pelanggaran `#DC2626`.
- **Karakter Visual**: Bersih, profesional, bebas efek glowing neon, dan tidak menggunakan emoji (menggunakan vector icon SVG dari Lucide).

---

## Petunjuk Penggunaan & Menghubungkan Supabase

### 1. Menjalankan Server Lokal
```bash
npm run dev
```
Akses aplikasi melalui browser di `http://127.0.0.1:5173`.

### 2. Menghubungkan ke Database Supabase
1. Buka [Supabase Dashboard](https://supabase.com) dan buat proyek baru.
2. Buka menu **SQL Editor**, salin dan jalankan seluruh isi berkas `supabase_schema.sql` yang ada di direktori ini.
3. Di dalam aplikasi, klik menu **Penyimpanan / Atur** di bagian bawah sidebar (atau tombol **Konfigurasi** di halaman Login).
4. Masukkan **Project URL** dan **Anon Key** Supabase Anda, lalu klik **Simpan Konfigurasi**.
5. Sistem akan langsung beralih dan menyinkronkan data dengan database Supabase Anda.
