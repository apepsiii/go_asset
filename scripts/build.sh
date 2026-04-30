#!/bin/bash
set -e

echo "LabAsset Manager - Quick Build"
echo ""

cd "$(dirname "$0")/.."

# Check React
if [ ! -d "web/dist" ]; then
    echo "ERROR: web/dist not found!"
    echo "Run 'npm run build' in web folder first."
    exit 1
fi

# Prepare embedded files
echo "Preparing files..."
rm -rf cmd/server/dist cmd/server/migrations
cp -r web/dist cmd/server/
cp -r migrations cmd/server/

# Build
echo "Building..."
OUTPUT="lab_asset_built"
CGO_ENABLED=0 go build -ldflags="-s -w" -o "$OUTPUT" ./cmd/server

# Cleanup
rm -rf cmd/server/dist cmd/server/migrations

echo ""
echo "Done: $OUTPUT"
echo "Size: $(ls -lh "$OUTPUT | awk '{print $5}')"
