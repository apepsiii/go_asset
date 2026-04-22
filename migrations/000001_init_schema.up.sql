-- 1. Tabel Kategori
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Sumber Anggaran
CREATE TABLE IF NOT EXISTS budget_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Lokasi
CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel Utama Aset
CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    budget_source_id INTEGER,
    location_id INTEGER,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    specification TEXT,
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
CREATE TABLE IF NOT EXISTS maintenance_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER,
    action_date DATE NOT NULL,
    description TEXT,
    technician_name TEXT,
    cost REAL DEFAULT 0,
    FOREIGN KEY (asset_id) REFERENCES assets(id)
);

-- 6. Tabel Log Upgrade
CREATE TABLE IF NOT EXISTS upgrade_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER,
    upgrade_date DATE NOT NULL,
    description TEXT,
    FOREIGN KEY (asset_id) REFERENCES assets(id)
);
