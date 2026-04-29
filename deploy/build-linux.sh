#!/bin/bash

# ============================================================
# LabAsset Manager - Build Linux Binary
# ============================================================
# Output: go_asset_v{major}_{minor}_{YYMMDD}
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEPLOY_DIR="$PROJECT_ROOT/deploy"

echo "========================================"
echo "  LabAsset Manager - Build Linux Binary"
echo "========================================"
echo ""

# Load version from .env
MAJOR="1"
MINOR="0"
if [ -f "$PROJECT_ROOT/.env" ]; then
    source <(grep -E '^APP_VERSION_' "$PROJECT_ROOT/.env" | xargs)
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

# Step 1: Build React if not built
echo "[1/4] Checking React build..."
if [ ! -d "$PROJECT_ROOT/web/dist" ]; then
    echo "  ERROR: web/dist not found!"
    echo "  Please run 'npm run build' in web folder first."
    exit 1
fi
echo "  OK: web/dist found"

# Step 2: Copy dist to project root for embed
echo "[2/4] Preparing embedded files..."
rm -rf "$PROJECT_ROOT/dist"
cp -r "$PROJECT_ROOT/web/dist" "$PROJECT_ROOT/dist"
echo "  OK: Copied web/dist to project root"

# Step 3: Build Go binary
echo "[3/4] Building Go binary for Linux..."
cd "$PROJECT_ROOT"
GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o "$OUTPUT_NAME" ./cmd/server

if [ $? -ne 0 ]; then
    echo ""
    echo "========================================"
    echo "  ERROR: Build failed!"
    echo "========================================"
    exit 1
fi

chmod +x "$OUTPUT_NAME"
echo "  OK: Binary built: $OUTPUT_NAME"

# Step 4: Copy to deploy folder
echo "[4/4] Copying to deploy folder..."
cp "$OUTPUT_NAME" "$DEPLOY_DIR/$OUTPUT_NAME"
rm -rf "$PROJECT_ROOT/dist"
echo "  OK: Copied to deploy/$OUTPUT_NAME"

echo ""
echo "========================================"
echo "  Build Successful!"
echo "========================================"
echo ""
echo "  Binary: deploy/$OUTPUT_NAME"
echo "  Size:  $(ls -lh "$DEPLOY_DIR/$OUTPUT_NAME" | awk '{print $5}')"
echo ""
