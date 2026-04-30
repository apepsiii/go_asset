#!/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "Building LabAsset Manager..."
echo ""

if [ ! -d "web/dist" ]; then
    echo "ERROR: web/dist not found!"
    echo "Run 'npm run build' in web folder first."
    exit 1
fi

rm -rf cmd/server/dist cmd/server/migrations
cp -r web/dist cmd/server/
cp -r migrations cmd/server/

OUTPUT="lab_asset_built"
CGO_ENABLED=0 go build -ldflags="-s -w" -o "$OUTPUT" ./cmd/server

rm -rf cmd/server/dist cmd/server/migrations

echo "Done: $OUTPUT"
echo "Size: $(ls -lh "$OUTPUT | awk '{print $5}')"
