# LabAsset-Manager (SMK Edition)

Aplikasi manajemen inventaris laboratorium komputer untuk sekolah SMKs dengan Golang Echo v5 + Vite + React + SQLite.

## Fitur Utama

### Manajemen Master Data
- **Kategori**: Kategori aset (Laptop, PC Desktop, Switch, dll)
- **Sumber Anggaran**: Sumber dana (BOS, Hibah, dll)
- **Lokasi**: Lokasi aset (Lab 1, Lab 2, dll)

### Manajemen Aset
- CRUD lengkap aset dengan foto, spesifikasi, dan kondisi
- Kondisi aset: OK, RUSAK_RINGAN, RUSAK_TOTAL, MAINTENANCE
- Tracking warranty expiry dan harga pembelian

### Peminjaman Aset (Loans)
- Pencatatan peminjaman aset ke siswa/guru
- Tracking due date dan status (BORROWED, RETURNED, OVERDUE)
- Riwayat kondisi aset saat dipinjam dan dikembalikan
- Dashboard loan stats

### Log Riwayat
- **Maintenance Log**: Riwayat perawatan dengan teknisi dan biaya
- **Upgrade Log**: Riwayat upgrade komponen

### QR Code & Cetak Label
- Generate QR code per aset
- Download PDF label siap cetak
- Halaman publik read-only untuk scan QR code

### Dashboard & Statistik
- Visualisasi data aset dengan grafik (Recharts)
- Statistik total aset, kondisi, per lokasi, per kategori
- Loan statistics (active, overdue, available)

### Import & Export
- Export data aset ke CSV
- Import aset dari file CSV

### Audit Log
- Tracking semua aksi pengguna (CREATE, READ, UPDATE, DELETE, UPLOAD, LOGIN)
- Record IP address dan timestamp

### Notifications
- Warranty expiry alerts
- Broken assets alerts
- Notification summary

### Depreciation Tracking (Penyusutan Aset)
- Kalkulasi penyusutan dengan metode garis lurus (straight-line depreciation)
- Automatic calculation: Current Value, Annual Depreciation, Accumulated Depreciation
- Status: Healthy (>50% life), Depreciated (<50% life), Fully Depreciated
- Default useful life: 5 tahun, salvage value: 0
- Visible di asset detail page dan reports

### Quick Loan / Kiosk Mode
- Halaman scan cepat tanpa login Clerk (`/quick-loan`)
- QR code scanner dengan kamera HP/tablet
- Input manual ID aset juga tersedia
- Validasi PIN admin untuk keamanan
- Rate limiting untuk mencegah brute-force (10 attempts per 5 menit)
- Durasi pinjam bisa dipilih (1-30 hari)
- Success animation dan auto-reset untuk scan berikutnya
- Audit log tetap tercatat untuk setiap quick loan

### Mass Label Printing
- Customizable label design dengan logo sekolah dan nama institusi
- Kustomisasi grid layout A4 (rows x columns)
- Bulk selection assets untuk print banyak label sekaligus
- QR code dengan full URL payload untuk quick scan
- Preview grid sebelum print
- Settings untuk konfigurasi label (Tom & Jerry, Keke, custom)

### Authentication
- Clerk untuk autentikasi
- User management dengan role (admin, user)

## Tech Stack

### Backend
- **Golang 1.25** dengan Echo v5.1
- **SQLite** dengan driver `modernc.org/sqlite` dan `github.com/mattn/go-sqlite3`
- **Clerk SDK** untuk autentikasi
- **Arsitektur**: Handler → Service → Repository pattern

### Frontend
- **Vite** + **React 19**
- **TanStack Router** untuk routing
- **Shadcn UI** + **Tailwind CSS v4**
- **Zustand** (state management)
- **TanStack Query** (data fetching)
- **TanStack Table** (data tables)
- **Recharts** (charts)
- **React Hook Form** + **Zod** (forms & validation)
- **Clerk** (authentication)
- **Vitest** + **Playwright** (testing)

## Struktur Project

```
go_asset/
├── cmd/
│   └── api/
│       └── main.go              # Entry point
├── internal/
│   ├── handler/                 # HTTP Handlers
│   │   ├── asset.go
│   │   ├── audit_log.go
│   │   ├── budget_source.go
│   │   ├── category.go
│   │   ├── export.go
│   │   ├── import.go
│   │   ├── label.go
│   │   ├── location.go
│   │   ├── loan.go
│   │   ├── maintenance_log.go
│   │   ├── notification.go
│   │   ├── qrcode.go
│   │   ├── stats.go
│   │   └── upload.go
│   ├── middleware/
│   │   └── auth.go              # Clerk auth middleware
│   ├── models/
│   │   └── models.go            # Database models
│   ├── repository/
│   │   └── db.go                # Database operations
│   └── service/
│       ├── audit.go
│       ├── export.go
│       ├── loan.go
│       ├── notification.go
│       └── service.go
├── migrations/                   # SQLite migrations
│   ├── 000001_init_schema.up.sql
│   ├── 000002_users.up.sql
│   ├── 000003_audit_logs.up.sql
│   └── 000004_loans.up.sql
├── uploads/                     # File uploads
├── web/                         # Frontend (Vite + React)
│   ├── src/
│   │   ├── features/            # Feature modules
│   │   │   ├── assets/
│   │   │   ├── audit-logs/
│   │   │   ├── dashboard/
│   │   │   ├── loans/
│   │   │   ├── master-data/
│   │   │   └── notifications/
│   │   ├── lib/
│   │   │   └── api.ts          # API client
│   │   ├── routes/             # TanStack Router routes
│   │   └── components/        # UI components
│   └── ...
├── data/                        # SQLite database (auto-created)
├── .env                         # Environment variables
├── .air.toml                    # Air live-reload config
└── go.mod
```

## Database Schema

### Tables
| Table | Description |
|-------|-------------|
| `categories` | Kategori aset (Laptop, PC Desktop, Switch, dll) |
| `budget_sources` | Sumber anggaran (BOS, Hibah, dll) |
| `locations` | Lokasi aset (Lab 1, Lab 2, dll) |
| `assets` | Data utama aset |
| `maintenance_logs` | Riwayat perawatan |
| `upgrade_logs` | Riwayat upgrade |
| `users` | User yang disinkronisasi dari Clerk |
| `audit_logs` | Log aktivitas pengguna |
| `loans` | Data peminjaman aset |

### Asset Condition Values
- `OK` - Kondisi baik
- `RUSAK_RINGAN` - Rusak ringan
- `RUSAK_TOTAL` - Rusak total
- `MAINTENANCE` - Sedang dalam perawatan

## API Endpoints

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List all |
| GET | `/api/categories/:id` | Get by ID |
| POST | `/api/categories` | Create |
| PUT | `/api/categories/:id` | Update |
| DELETE | `/api/categories/:id` | Delete |

### Budget Sources
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/budget-sources` | List all |
| GET | `/api/budget-sources/:id` | Get by ID |
| POST | `/api/budget-sources` | Create |
| PUT | `/api/budget-sources/:id` | Update |
| DELETE | `/api/budget-sources/:id` | Delete |

### Locations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/locations` | List all |
| GET | `/api/locations/:id` | Get by ID |
| POST | `/api/locations` | Create |
| PUT | `/api/locations/:id` | Update |
| DELETE | `/api/locations/:id` | Delete |

### Assets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assets` | List all (with search, filter, pagination) |
| GET | `/api/assets/:id` | Get by ID |
| POST | `/api/assets` | Create |
| PUT | `/api/assets/:id` | Update |
| DELETE | `/api/assets/:id` | Delete |

### Maintenance Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assets/:assetId/maintenance-logs` | List by asset |
| POST | `/api/assets/:assetId/maintenance-logs` | Create |
| DELETE | `/api/maintenance-logs/:id` | Delete |

### Upgrade Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assets/:assetId/upgrade-logs` | List by asset |
| POST | `/api/assets/:assetId/upgrade-logs` | Create |
| DELETE | `/api/upgrade-logs/:id` | Delete |

### QR Code & Label
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assets/:id/qrcode` | Generate QR code |
| GET | `/api/assets/:id/label/pdf` | Download PDF label |

### Dashboard Statistics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats/dashboard` | Dashboard statistics |

### Loan Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/loans` | List all (with filters) |
| GET | `/api/loans/active` | List active loans |
| GET | `/api/loans/overdue` | List overdue loans |
| GET | `/api/loans/:id` | Get by ID |
| POST | `/api/loans` | Create loan |
| PUT | `/api/loans/:id/return` | Return asset |
| GET | `/api/assets/available` | List available assets for loan |
| GET | `/api/loans/stats` | Loan statistics |
| POST | `/api/loans/quick` | Quick loan (kiosk mode, PIN auth) |

### Import & Export
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/export/assets/csv` | Export assets to CSV |
| POST | `/api/import/assets/csv` | Import assets from CSV |

### Audit Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/audit-logs` | List all audit logs |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications/summary` | Notification summary |
| GET | `/api/notifications/warranty` | Warranty expiry alerts |
| GET | `/api/notifications/broken-assets` | Broken assets alerts |

### Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload file |

### Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings` | Get app settings |
| PUT | `/api/settings` | Update settings |
| POST | `/api/settings/logo` | Upload logo |
| GET | `/api/public/settings` | Public settings (for quick-loan) |

### Static Files
- `/uploads/*` - Serve uploaded files

### Public Pages
- `/public/asset/:id` - Halaman publik read-only untuk scan QR code

## Menjalankan Project

### Prerequisites
- Go 1.25+
- Node.js 18+
- pnpm (recommended) or npm

### Backend

```bash
# Initialize database & run server
./lab-asset-manager.exe

# Or with custom port
PORT=3000 ./lab-asset-manager.exe

# Or with custom DB path
DB_PATH=/path/to/db ./lab-asset-manager.exe

# Development with live-reload (requires Air)
air
```

### Frontend

```bash
cd web
pnpm install
pnpm dev
```

### Environment Variables

Salin contoh environment variables:

```bash
cp .env.example .env
cp web/.env.example web/.env
```

Edit file `.env` sesuai konfigurasi Anda.

### Testing

```bash
# Frontend tests
cd web
pnpm test           # Run tests
pnpm test:watch     # Watch mode
pnpm test:ui         # UI mode
pnpm test:coverage   # Coverage report
```

## Project Status

### Completed Features
- [x] **Phase 1**: Fondasi & Inisialisasi (Backend API + Frontend Setup)
- [x] **Phase 2a**: Master Data - Categories (Halaman + API)
- [x] **Phase 2b**: Master Data - Budget Sources (Halaman + API)
- [x] **Phase 2c**: Master Data - Locations (Halaman + API)
- [x] **Phase 3a**: Assets List (Halaman dengan search & filter)
- [x] **Phase 3b**: Asset Detail Page dengan tabs (Maintenance/Upgrade logs)
- [x] **Phase 3c**: Add/Edit Asset Form dengan photo upload
- [x] **Phase 4**: QR Code & Cetak Kartu (API QR Code + PDF Label)
- [x] **Phase 5**: Public Landing Page untuk QR Scan
- [x] **Phase 6**: Dashboard dengan grafik Statistik
- [x] **Phase 7**: Clerk Authentication Integration
- [x] **Phase 8**: Loan Management System
- [x] **Phase 9**: Import/Export CSV
- [x] **Phase 10**: Audit Logging
- [x] **Phase 11**: Depreciation Tracking (Penyusutan Aset)
- [x] **Phase 12**: Quick Loan / Kiosk Mode
- [x] **Phase 13**: Mass Label Printing
- [ ] **Phase 14**: Deployment & Docker

## Lisensi

MIT License
