#!/bin/bash

# ============================================================
# LabAsset Manager - Build Linux Binary (Run on Linux VPS)
# ============================================================
# Usage: ./build-vps.sh
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================"
echo "  LabAsset Manager - Build for VPS"
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

# Output filename
OUTPUT_NAME="go_asset_v${MAJOR}_${MINOR}_${DATE}"

echo "Configuration:"
echo "  Version: $MAJOR.$MINOR"
echo "  Date:    $DATE"
echo "  Output:  $OUTPUT_NAME"
echo ""

# Step 1: Check/Clean dist
echo "[1/5] Preparing build directory..."
rm -rf cmd/server/dist
mkdir -p cmd/server
echo "  OK"

# Step 2: Build React if needed
echo "[2/5] Checking frontend build..."
if [ ! -d "web/dist" ]; then
    echo "  WARNING: web/dist not found!"
    echo "  Please upload web/dist folder to this server"
    echo "  Or run 'npm run build' on build machine"
else
    echo "  OK: web/dist found"
fi

# Step 3: Copy dist for embed
if [ -d "web/dist" ]; then
    echo "[3/5] Copying frontend for embedding..."
    cp -r web/dist cmd/server/dist
    echo "  OK"
else
    echo "[3/5] Skipping - no web/dist"
fi

# Step 4: Build Go binary
echo "[4/5] Building Go binary for Linux..."
CGO_ENABLED=0 go build -ldflags="-s -w" -o "$OUTPUT_NAME" ./cmd/server

if [ $? -ne 0 ]; then
    echo ""
    echo "========================================"
    echo "  ERROR: Build failed!"
    echo "========================================"
    exit 1
fi

chmod +x "$OUTPUT_NAME"
echo "  OK: Binary built"

# Step 5: Cleanup
echo "[5/5] Cleaning up..."
rm -rf cmd/server/dist
echo "  OK"

echo ""
echo "========================================"
echo "  Build Complete!"
echo "========================================"
echo ""
echo "  Binary: $OUTPUT_NAME"
echo "  Size:   $(ls -lh "$OUTPUT_NAME" | awk '{print $5}')"
echo ""
echo "  To run:"
echo "    ./$OUTPUT_NAME"
echo ""
echo "  To run installer wizard:"
echo "    INSTALL_MODE=wizard ./$OUTPUT_NAME"
echo ""
