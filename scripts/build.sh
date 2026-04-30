#!/bin/bash
set -e

echo "========================================"
echo "  LabAsset Manager - All-in-One Build"
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
BINARY="lab_asset_v${MAJOR}_${MINOR}_${DATE}_linux_amd64"

echo "Version: $MAJOR.$MINOR"
echo "Date: $DATE"
echo "Binary: $BINARY"
echo ""

# Step 1: Build React if needed
if [ ! -d "web/dist" ]; then
    echo "[1/5] Building React frontend..."
    cd web
    npm install --silent 2>/dev/null
    npm run build
    cd ..
else
    echo "[1/5] React build found (skipping)"
fi

# Step 2: Prepare embedded files
echo "[2/5] Preparing embedded files..."
rm -rf cmd/server/dist cmd/server/migrations
mkdir -p cmd/server
cp -r web/dist cmd/server/
cp -r migrations cmd/server/
echo "  OK"

# Step 3: Build Go binary
echo "[3/5] Building Go binary..."
CGO_ENABLED=0 go build -ldflags="-s -w" -o "$BINARY" ./cmd/server
chmod +x "$BINARY"
echo "  OK"

# Step 4: Cleanup
echo "[4/5] Cleaning up..."
rm -rf cmd/server/dist cmd/server/migrations
echo "  OK"

# Step 5: Verify
echo "[5/5] Verifying..."
if [ -f "$BINARY" ]; then
    SIZE=$(ls -lh "$BINARY" | awk '{print $5}')
    echo "  OK: $SIZE"
else
    echo "  FAILED!"
    exit 1
fi

echo ""
echo "========================================"
echo "  Build Complete!"
echo "========================================"
echo ""
echo "Binary: $BINARY ($SIZE)"
echo ""
echo "Upload to VPS and run:"
echo "  scp $BINARY root@vps:/opt/lab_asset/"
echo ""
echo "On VPS:"
echo "  chmod +x $BINARY"
echo "  INSTALL_MODE=wizard ./$BINARY"
echo ""
