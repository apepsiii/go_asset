#!/bin/bash

# ============================================================
# LabAsset Manager - Build for All Platforms
# ============================================================
# Generates:
#   - go_asset_v{major}_{minor}_{date}_linux_amd64
#   - go_asset_v{major}_{minor}_{date}_linux_arm64
#   - go_asset_v{major}_{minor}_{date}_windows_amd64.exe
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

echo "========================================"
echo "  LabAsset Manager - Build All Platforms"
echo "========================================"
echo ""

# Load version from .env
MAJOR="1"
MINOR="0"
if [ -f ".env" ]; then
    source <(grep -E '^APP_VERSION_' .env | xargs)
    MAJOR="${APP_VERSION_MAJOR:-$MAJOR}"
    MINOR="${APP_VERSION_MINOR:-$MINOR}"
fi

# Get date in YYMMDD format
DATE=$(date +%y%m%d)

echo "Configuration:"
echo "  Version: $MAJOR.$MINOR"
echo "  Date:    $DATE"
echo ""

# Step 1: Check React build
echo "[1/3] Checking React build..."
if [ ! -d "web/dist" ]; then
    echo "  ERROR: web/dist not found!"
    echo "  Please run 'npm run build' in web folder first."
    exit 1
fi
echo "  OK: web/dist found"

# Step 2: Build for each platform
echo "[2/3] Building binaries..."

# Linux AMD64
echo "  Building Linux AMD64..."
rm -rf cmd/server/dist
cp -r web/dist cmd/server/dist
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -ldflags="-s -w" -o "go_asset_v${MAJOR}_${MINOR}_${DATE}_linux_amd64" ./cmd/server
chmod +x "go_asset_v${MAJOR}_${MINOR}_${DATE}_linux_amd64"
echo "  OK: go_asset_v${MAJOR}_${MINOR}_${DATE}_linux_amd64"

# Linux ARM64
echo "  Building Linux ARM64..."
GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -ldflags="-s -w" -o "go_asset_v${MAJOR}_${MINOR}_${DATE}_linux_arm64" ./cmd/server
chmod +x "go_asset_v${MAJOR}_${MINOR}_${DATE}_linux_arm64"
echo "  OK: go_asset_v${MAJOR}_${MINOR}_${DATE}_linux_arm64"

# Windows AMD64
echo "  Building Windows AMD64..."
GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -ldflags="-s -w" -o "go_asset_v${MAJOR}_${MINOR}_${DATE}_windows_amd64.exe" ./cmd/server
echo "  OK: go_asset_v${MAJOR}_${MINOR}_${DATE}_windows_amd64.exe"

# Step 3: Cleanup
echo "[3/3] Cleaning up..."
rm -rf cmd/server/dist
echo "  OK"

echo ""
echo "========================================"
echo "  Build Complete!"
echo "========================================"
echo ""
echo "  Linux AMD64:   go_asset_v${MAJOR}_${MINOR}_${DATE}_linux_amd64"
echo "  Linux ARM64:   go_asset_v${MAJOR}_${MINOR}_${DATE}_linux_arm64"
echo "  Windows AMD64: go_asset_v${MAJOR}_${MINOR}_${DATE}_windows_amd64.exe"
echo ""
echo "  Copy to deploy folder..."
cp "go_asset_v${MAJOR}_${MINOR}_${DATE}_linux_amd64" "$SCRIPT_DIR/"
cp "go_asset_v${MAJOR}_${MINOR}_${DATE}_linux_arm64" "$SCRIPT_DIR/"
cp "go_asset_v${MAJOR}_${MINOR}_${DATE}_windows_amd64.exe" "$SCRIPT_DIR/"
echo "  Done!"
echo ""
