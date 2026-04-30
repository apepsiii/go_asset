#!/bin/bash
set -e

echo "========================================"
echo "  LabAsset Manager - Build All Platforms"
echo "========================================"
echo ""

cd "$(dirname "$0")"

# Load version from .env
MAJOR="1"
MINOR="0"
if [ -f "../.env" ]; then
    source <(grep -E '^APP_VERSION_' ../.env | xargs)
    MAJOR="${APP_VERSION_MAJOR:-$MAJOR}"
    MINOR="${APP_VERSION_MINOR:-$MINOR}"
fi

DATE=$(date +%y%m%d)
DEPLOY_DIR="deploy"

echo "Version: $MAJOR.$MINOR"
echo "Date: $DATE"
echo ""

# Create deploy directory
mkdir -p "$DEPLOY_DIR"

# Check React build
if [ ! -d "../web/dist" ]; then
    echo "ERROR: web/dist not found!"
    echo "Please run 'npm run build' in web folder first."
    exit 1
fi

echo "[1/4] Preparing embedded files..."
rm -rf ../cmd/server/dist ../cmd/server/migrations
cp -r ../web/dist ../cmd/server/
cp -r ../migrations ../cmd/server/
echo "      OK"

echo "[2/4] Building Linux AMD64..."
go build -ldflags="-s -w" -o "$DEPLOY_DIR/lab_asset_v${MAJOR}_${MINOR}_${DATE}_linux_amd64" ../cmd/server
chmod +x "$DEPLOY_DIR/lab_asset_v${MAJOR}_${MINOR}_${DATE}_linux_amd64"
echo "      Done: deploy/lab_asset_v${MAJOR}_${MINOR}_${DATE}_linux_amd64"

echo "[3/4] Building Linux ARM64..."
GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -ldflags="-s -w" -o "$DEPLOY_DIR/lab_asset_v${MAJOR}_${MINOR}_${DATE}_linux_arm64" ../cmd/server
chmod +x "$DEPLOY_DIR/lab_asset_v${MAJOR}_${MINOR}_${DATE}_linux_arm64"
echo "      Done: deploy/lab_asset_v${MAJOR}_${MINOR}_${DATE}_linux_arm64"

echo "[4/4] Building Windows AMD64..."
GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -ldflags="-s -w" -o "$DEPLOY_DIR/lab_asset_v${MAJOR}_${MINOR}_${DATE}_windows_amd64.exe" ../cmd/server
echo "      Done: deploy/lab_asset_v${MAJOR}_${MINOR}_${DATE}_windows_amd64.exe"

# Cleanup
rm -rf ../cmd/server/dist ../cmd/server/migrations

echo ""
echo "========================================"
echo "  Build Complete!"
echo "========================================"
echo ""
echo "Output files:"
ls -lh "$DEPLOY_DIR"/*.sh 2>/dev/null || true
ls -lh "$DEPLOY_DIR"/*.exe 2>/dev/null || true
ls -lh "$DEPLOY_DIR"/lab_asset_* 2>/dev/null || true
echo ""
