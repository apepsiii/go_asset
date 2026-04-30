#!/bin/bash
set -e

echo "========================================"
echo "  LabAsset Manager - Build for VPS"
echo "========================================"
echo ""

cd "$(dirname "$0")/.."

MAJOR="1"
MINOR="0"
if [ -f ".env" ]; then
    source <(grep -E '^APP_VERSION_' .env | xargs)
    MAJOR="${APP_VERSION_MAJOR:-$MAJOR}"
    MINOR="${APP_VERSION_MINOR:-$MINOR}"
fi

DATE=$(date +%y%m%d)
OUTPUT="deploy/lab_asset_v${MAJOR}_${MINOR}_${DATE}_linux_amd64"

echo "Version: $MAJOR.$MINOR"
echo "Date: $DATE"
echo "Output: $OUTPUT"
echo ""

if [ ! -d "web/dist" ]; then
    echo "ERROR: web/dist not found!"
    echo "Run 'npm run build' in web folder first."
    exit 1
fi

echo "[1/4] Preparing embedded files..."
rm -rf cmd/server/dist cmd/server/migrations
cp -r web/dist cmd/server/
cp -r migrations cmd/server/
echo "  OK"

echo "[2/4] Building Go binary..."
CGO_ENABLED=0 go build -ldflags="-s -w" -o "$OUTPUT" ./cmd/server
chmod +x "$OUTPUT"
echo "  OK: $OUTPUT"

echo "[3/4] Cleaning up..."
rm -rf cmd/server/dist cmd/server/migrations
echo "  OK"

echo "[4/4] Verifying build..."
if [ -f "$OUTPUT" ]; then
    SIZE=$(ls -lh "$OUTPUT" | awk '{print $5}')
    echo "  OK: $SIZE"
else
    echo "  FAILED: Binary not found"
    exit 1
fi

echo ""
echo "========================================"
echo "  Build Complete!"
echo "========================================"
echo ""
echo "Binary: $OUTPUT"
echo ""
echo "Upload to VPS and run:"
echo "  chmod +x $OUTPUT"
echo "  INSTALL_MODE=wizard .$OUTPUT"
echo ""
