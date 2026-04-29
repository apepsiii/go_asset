#!/bin/bash

# ============================================================
# LabAsset Manager - Wizard Installer
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BINARY="$SCRIPT_DIR/lab-asset-manager"

# Check if binary exists
if [ ! -f "$BINARY" ]; then
    echo ""
    echo "========================================"
    echo "  ERROR: Binary not found!"
    echo "========================================"
    echo ""
    echo "  Please build the binary first:"
    echo "    ./build-linux.sh"
    echo ""
    exit 1
fi

echo ""
echo "========================================"
echo "  LabAsset Manager - Installation Wizard"
echo "========================================"
echo ""

# Check if .env exists
if [ -f "$SCRIPT_DIR/.env" ]; then
    echo "WARNING: Existing .env file found."
    echo "This will be backed up and replaced."
    cp "$SCRIPT_DIR/.env" "$SCRIPT_DIR/.env.backup"
    echo "Backup saved to: .env.backup"
    echo ""
fi

# Run wizard
echo "Starting installation wizard..."
echo ""

INSTALL_MODE=wizard "$BINARY"

# Check if .env was created
if [ -f "$SCRIPT_DIR/.env" ]; then
    echo ""
    echo "========================================"
    echo "  SUCCESS: Installation Complete!"
    echo "========================================"
    echo ""
    echo "Configuration saved to: .env"
    echo ""
    echo "To start the server:"
    echo "  ./start.sh"
    echo ""
else
    echo ""
    echo "========================================"
    echo "  ERROR: Installation failed!"
    echo "========================================"
    echo ""
    echo "Please try again or check the error messages above."
    echo ""
fi
