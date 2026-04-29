#!/bin/bash
echo "Building LabAsset Manager for Linux..."
cd "$(dirname "$0")/.."
GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o deploy/lab-asset-manager ./cmd/server
chmod +x deploy/lab-asset-manager
echo "Build complete: deploy/lab-asset-manager"
