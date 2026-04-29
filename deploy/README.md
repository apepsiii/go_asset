# LabAsset Manager - Deployment

## Requirements
- Go 1.21+ (for building from source)

## Quick Start

### Option 1: Wizard Installer (Recommended)
1. Extract this archive
2. Run: `INSTALL_MODE=wizard ./lab-asset-manager`
3. Follow the wizard instructions
4. Access at http://localhost:PORT

### Option 2: Manual Setup
1. Create `.env` file:
```
PORT=8080
DB_PATH=./data/lab_asset.db
ALLOW_UNAUTHENTICATED=1
```
2. Create data folder: `mkdir -p data`
3. Run: `./lab-asset-manager`

## First Time Setup
1. Run the application
2. Go to Settings > Label Settings to configure label layouts
3. Add categories, locations, budget sources in Master Data
4. Start adding assets!

## Port Configuration
Edit `.env` file:
```
PORT=3000
```
Then restart the application.

## File Structure
```
.
├── lab-asset-manager  (or .exe on Windows)
├── .env               (configuration)
├── data/              (SQLite database - auto created)
└── uploads/          (uploaded files - auto created)
```

## Troubleshooting
- If port is already in use, change PORT in .env
- If database error, ensure write permission to data folder
- Check logs for detailed error messages
