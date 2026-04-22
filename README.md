# LabAsset-Manager (SMK Edition)

Aplikasi manajemen inventaris laboratorium komputer untuk sekolah SMKs dengan Golang Echo v5.1 + Vite + React + SQLite.

## Fitur Utama

- **Manajemen Master Data**: Kategori, Sumber Anggaran, Lokasi
- **Manajemen Aset**: Foto, spesifikasi, kondisi aset
- **Log Riwayat**: Maintenance & Upgrade tracking
- **QR Code & Cetak**: Generate QR code dan PDF label aset
- **Dashboard**: Visualisasi data aset dengan grafik
- **Authentication**: Clerk untuk autentikasi

## Tech Stack

### Backend
- **Golang** dengan Echo v5.1
- **SQLite** dengan driver `modernc.org/sqlite`
- **Arsitektur**: Handler → Repository pattern

### Frontend
- **Vite** + **React 19**
- **TanStack Router**
- **Shadcn UI** + **Tailwind CSS v4**
- **Zustand** (state management)
- **TanStack Table** (data tables)
- **Recharts** (charts)
- **React Hook Form** + **Zod** (forms)
- **Clerk** (authentication)

## Struktur Project

```
lab-asset-manager/
├── cmd/
│   └── api/
│       └── main.go           # Entry point
├── internal/
│   ├── handler/              # HTTP Handlers
│   │   ├── asset.go
│   │   ├── budget_source.go
│   │   ├── category.go
│   │   ├── location.go
│   │   ├── maintenance_log.go
│   │   ├── upgrade_log.go
│   │   ├── qrcode.go
│   │   ├── label.go
│   │   ├── stats.go
│   │   └── upload.go
│   ├── models/              # Database models
│   │   └── models.go
│   └── repository/          # Database operations
│       └── db.go
├── migrations/               # SQLite migrations
│   └── 000001_init_schema.up.sql
├── uploads/                 # File uploads
├── web/                    # Frontend (Vite + React)
│   ├── src/
│   │   ├── features/       # Feature modules
│   │   │   ├── master-data/ # Categories, Budget Sources, Locations
│   │   │   ├── assets/     # Assets management
│   │   │   └── dashboard/  # Dashboard with charts
│   │   ├── lib/            # Utilities
│   │   │   └── api.ts      # API client
│   │   ├── routes/         # TanStack Router routes
│   │   └── components/     # UI components
│   └── ...
├── lab-asset-manager.exe    # Built binary
└── README.md
```

## Database Schema

### Tables
- `categories` - Kategori aset (Laptop, PC Desktop, Switch, dll)
- `budget_sources` - Sumber anggaran (BOS, Hibah, dll)
- `locations` - Lokasi aset (Lab 1, Lab 2, dll)
- `assets` - Data utama aset
- `maintenance_logs` - Riwayat perawatan
- `upgrade_logs` - Riwayat upgrade

## API Endpoints

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
| GET | `/api/assets` | List all |
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

### Statistics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats/dashboard` | Dashboard statistics |

### Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload file |

### Static Files
- `/uploads/*` - Serve uploaded files

### Public Pages
- `/public/asset/:id` - Halaman publik read-only untuk scan QR code

## Menjalankan Project

### Prerequisites
- Go 1.21+
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
```

### Frontend

```bash
cd web
pnpm install
pnpm dev
```

### Environment Variables

**Backend (.env)**
```
PORT=8080
DB_PATH=./data/lab_asset.db
```

**Frontend (.env)**
```
VITE_API_URL=http://localhost:8080
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
```

## Roadmap

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
- [ ] **Phase 8**: Deployment & Docker

## Lisensi

MIT License
