@echo off
echo Building LabAsset Manager for Windows...
cd /d "%~dp0\.."
GOOS=windows GOARCH=amd64 go build -ldflags="-s -w" -o deploy/lab-asset-manager.exe ./cmd/server
echo Build complete: deploy/lab-asset-manager.exe
