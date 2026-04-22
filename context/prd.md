
# Product Requirements Document (PRD)
## Nama Proyek: LabAsset-Manager (SMK Edition)

### 1. Ringkasan Eksekutif
Aplikasi ini dirancang untuk mengelola inventaris laboratorium komputer di lingkungan sekolah secara digital. Fokus utamanya adalah transparansi anggaran, pemantauan kondisi fisik secara real-time, dan mempermudah teknisi dalam melacak riwayat pemeliharaan serta peningkatan (*upgrade*) perangkat keras.
gunakan golang echo v5.1 (https://github.com/labstack/echo)

### 2. Sasaran & Tujuan
* **Sentralisasi Data:** Menghapus pencatatan manual (kertas/spreadsheet yang terpisah).
* **Transparansi Audit:** Melacak asal dana (BOS, Hibah, dll) dan tanggal pembelian untuk keperluan inventarisasi aset negara/sekolah.
* **Visibilitas Cepat:** Menyediakan kartu kondisi fisik dengan QR Code untuk pengecekan cepat tanpa login ke sistem.

### 3. Fitur Utama (Functional Requirements)

#### A. Manajemen Master Data
* **Kategori:** Manajemen tipe aset (Laptop, PC Desktop, Switch, Proyektor).
* **Sumber Anggaran:** Pengelompokan aset berdasarkan asal dana (BOS Reguler, BOS Kinerja, Dana Komite, Hibah Industri).
* **Lokasi:** Detail posisi aset (Lab 1, Meja 01).

#### B. Manajemen Aset & Spesifikasi
* **Katalog Aset:** Upload foto aset, input spesifikasi teknis (CPU, RAM, Disk, SN).
* **Kondisi Aset:** Status dinamis (OK, Rusak Ringan, Rusak Total, Masa Perbaikan).
* **Atribut Sekolah:** Tanggal beli, harga beli, dan masa garansi.

#### C. Log Riwayat (Activity Tracking)
* **Maintenance:** Log perbaikan rutin (Pembersihan, Ganti Thermal Paste).
* **Upgrade:** Log perubahan hardware (Tambah RAM, Ganti SSD).

#### D. Modul QR & Cetak
* **Cetak Kartu:** Fitur generate PDF untuk label monitor yang memuat Nama, Kode, Kondisi, dan QR Code.
* **Scan Landing Page:** Halaman publik (read-only) untuk melihat spesifikasi saat QR di-scan.

---

### 4. Arsitektur Data (ERD)

Berikut adalah visualisasi hubungan antar tabel yang akan kita bangun dalam database SQLite:


---

### 5. Struktur Folder Proyek (Monolith Go)

Sesuai standar pengembangan Go, kita akan menggunakan struktur yang bersih agar mudah di-maintain:

```text
lab-asset-manager/
├── cmd/
│   └── api/
│       └── main.go           # Entry point aplikasi
├── internal/
│   ├── handler/              # HTTP Handlers (Controller)
│   ├── repository/           # Database Query (SQL)
│   ├── service/              # Logika Bisnis
│   ├── models/               # Struct Database (GORM atau Plain)
│   └── middleware/           # Auth & Logging
├── migrations/               # File .sql untuk SQLite
│   ├── 000001_init_schema.up.sql
│   └── 000001_init_schema.down.sql
├── uploads/                  # Folder penyimpanan foto aset
├── web/                      # Frontend (Next.js/React + Shadcn UI)
│   ├── components/
│   ├── pages/
│   └── lib/
├── .env                      # Konfigurasi
├── go.mod
└── Makefile                  # Shortcut untuk run, build, migrate
```

---

### 6. Database Migration (SQLite)

Simpan file ini di folder `migrations/000001_init_schema.up.sql`.

```sql
-- 1. Tabel Kategori
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Sumber Anggaran
CREATE TABLE budget_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Lokasi
CREATE TABLE locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel Utama Aset
CREATE TABLE assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    budget_source_id INTEGER,
    location_id INTEGER,
    code TEXT NOT NULL UNIQUE, -- Contoh: PC-LAB1-001
    name TEXT NOT NULL,
    specification TEXT,        -- JSON atau Long Text
    photo_url TEXT,
    condition TEXT CHECK(condition IN ('OK', 'RUSAK_RINGAN', 'RUSAK_TOTAL', 'MAINTENANCE')) DEFAULT 'OK',
    purchase_date DATE,
    price REAL,
    warranty_expiry DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (budget_source_id) REFERENCES budget_sources(id),
    FOREIGN KEY (location_id) REFERENCES locations(id)
);

-- 5. Tabel Log Maintenance
CREATE TABLE maintenance_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER,
    action_date DATE NOT NULL,
    description TEXT,
    technician_name TEXT,
    cost REAL DEFAULT 0,
    FOREIGN KEY (asset_id) REFERENCES assets(id)
);

-- 6. Tabel Log Upgrade
CREATE TABLE upgrade_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER,
    upgrade_date DATE NOT NULL,
    description TEXT, -- Contoh: RAM 8GB -> 16GB
    FOREIGN KEY (asset_id) REFERENCES assets(id)
);
```