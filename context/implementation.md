Berikut adalah rencana implementasi (Roadmap) untuk membangun **LabAsset-Manager**. 

Mengingat proyek ini menggunakan *stack* modern (Golang + Next.js) dan menargetkan penggunaan di lingkungan sekolah (SMK), pendekatan terbaik adalah menggunakan metode *Agile* dengan membaginya ke dalam beberapa **Fase (Sprint)**. Setiap fase dirancang agar menghasilkan fitur yang bisa langsung diuji coba.

---

### Fase 1: Fondasi & Inisialisasi (Minggu 1)
**Fokus:** Menyiapkan kerangka kerja, koneksi database, dan struktur dasar aplikasi.

* **Backend (Golang):**
    * Inisialisasi modul Go (`go mod init`).
    * Setup *framework* HTTP (direkomendasikan menggunakan **Gin** atau **Echo**).
    * Setup koneksi ke SQLite.
    * Menjalankan skrip *Database Migration* (membuat tabel yang sudah dirancang sebelumnya).
* **Frontend (Next.js):**
    * Inisialisasi proyek Next.js dengan TypeScript dan Tailwind CSS.
    * Setup **Shadcn UI** dan menginstal komponen dasar (Button, Table, Input, Form, Card).
    * Membuat *layout* dasar aplikasi (Sidebar Menu, Topbar).

### Fase 2: Manajemen Master Data (Minggu 2)
**Fokus:** Membuat pondasi data (Kategori, Anggaran, Lokasi) sebelum aset ditambahkan.

* **Backend:**
    * Membuat REST API (CRUD: *Create, Read, Update, Delete*) untuk tabel `categories`, `budget_sources`, dan `locations`.
* **Frontend:**
    * Membuat halaman Master Data.
    * Membangun form input dengan validasi (menggunakan *React Hook Form* & *Zod*).
    * Menampilkan data master dalam bentuk tabel menggunakan komponen Data-Table Shadcn.

### Fase 3: Core Fitur (Manajemen Aset & Foto) (Minggu 3)
**Fokus:** Mengelola data utama (Aset), termasuk spesifikasi dan unggah foto.

* **Backend:**
    * Membuat API CRUD untuk tabel `assets`.
    * Membuat fungsi *File Upload* di Go untuk menyimpan foto ke folder lokal `/uploads` dan menyimpan *path*-nya ke database.
    * Menambahkan endpoint statis untuk melayani (*serve*) file gambar ke *frontend*.
* **Frontend:**
    * Membuat halaman "Daftar Aset" dengan fitur pencarian dan filter (berdasarkan Lokasi atau Kondisi).
    * Membuat form "Tambah Aset Baru" yang mencakup *dropdown* untuk relasi (Kategori, Anggaran, Lokasi) dan input file untuk foto.
    * Membuat halaman "Detail Aset" untuk melihat spesifikasi lengkap.

### Fase 4: Fitur Log Tracking (Maintenance & Upgrade) (Minggu 4)
**Fokus:** Mencatat riwayat perjalanan dan perawatan setiap perangkat keras.

* **Backend:**
    * Membuat API untuk `maintenance_logs` dan `upgrade_logs`.
    * Membuat *logic*: Jika aset diservis, ubah status kondisi `assets` secara otomatis (misal dari 'RUSAK_RINGAN' menjadi 'OK').
* **Frontend:**
    * Di dalam halaman "Detail Aset", tambahkan tab khusus untuk melihat "Riwayat Maintenance" dan "Riwayat Upgrade".
    * Membuat tombol "Catat Perawatan/Upgrade" yang memunculkan *Modal* (Dialog Shadcn) untuk mengisi catatan teknisi.

### Fase 5: Modul QR Code & Cetak Kartu (Minggu 5)
**Fokus:** Identifikasi fisik aset untuk mempermudah operasional lab sehari-hari.

* **Backend:**
    * Mengintegrasikan library *QR Code Generator* (misal: `github.com/skip2/go-qrcode`).
    * Membuat API untuk menghasilkan dan mengunduh format PDF (Kartu Aset siap cetak) menggunakan library seperti `gofpdf`.
* **Frontend:**
    * Membuat tombol "Cetak Label" di halaman detail aset.
    * **Landing Page Publik:** Membuat satu halaman khusus *read-only* (tanpa perlu login) yang terbuka saat siswa atau guru men-scan QR code. Halaman ini hanya menampilkan Foto Aset, Spesifikasi, Kondisi, dan Tanggal Servis Terakhir.

### Fase 6: Dasbor Eksekutif & Deployment (Minggu 6)
**Fokus:** Memberikan *helicopter view* untuk Kepala Lab/Kepala Sekolah dan merilis aplikasi.

* **Integrasi Dasbor:**
    * Backend: Membuat API Statistik (Hitung total aset, persentase barang rusak, total aset per sumber anggaran).
    * Frontend: Membuat grafik visual (Barchart/Piechart) di halaman Utama/Home menggunakan **Recharts** (sering dipasangkan dengan Shadcn).
* **Testing & Bug Fixing:**
    * Menguji alur dari tambah aset hingga cetak label.
    * Memastikan aplikasi responsif jika dibuka dari tablet/HP.
* **Deployment (Server Lokal Sekolah):**
    * Mem- *build* aplikasi Go menjadi satu *binary execution*.
    * Mem- *build* frontend Next.js.
    * Menyiapkan server lokal di lab (bisa menggunakan Linux/Windows, disarankan dibungkus dengan *Docker* agar mudah dipindahkan).

---