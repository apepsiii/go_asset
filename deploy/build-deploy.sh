#!/bin/bash

# ============================================================
# LabAsset Manager - Deployment Builder Script
# ============================================================
# Usage: ./build-deploy.sh
# ============================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_DIR="$PROJECT_ROOT/deploy"
WEB_DIST="$PROJECT_ROOT/web/dist"
SERVER_DIR="$PROJECT_ROOT/cmd/server"

echo "========================================"
echo "  LabAsset Manager - Deployment Builder"
echo "========================================"
echo ""

# Clean previous build
echo "[1/5] Cleaning previous build..."
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# Build React Frontend
echo "[2/5] Building React frontend..."
cd "$PROJECT_ROOT/web"
npm run build

# Check if dist exists
if [ ! -d "$WEB_DIST" ]; then
    echo "ERROR: web/dist not found after build"
    exit 1
fi

# Copy React build to deploy
echo "[3/5] Copying React build to deploy folder..."
cp -r "$WEB_DIST" "$DEPLOY_DIR/dist"

# Create cmd/server directory
echo "[4/5] Creating server code..."
mkdir -p "$SERVER_DIR"

# Create main.go
cat > "$SERVER_DIR/main.go" << 'SERVEREOF'
package main

import (
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v5"
	echoMiddleware "github.com/labstack/echo/v5/middleware"
	"lab-asset-manager/internal/handler"
	"lab-asset-manager/internal/middleware"
	"lab-asset-manager/internal/repository"
)

//go:embed all:dist
var staticFiles embed.FS

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("Note: .env file not found, using environment variables")
	}

	if os.Getenv("ALLOW_UNAUTHENTICATED") == "1" {
		log.Println("INFO: Running in UNPROTECTED mode")
	}

	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "./data/lab_asset.db"
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	installMode := os.Getenv("INSTALL_MODE")
	if installMode == "wizard" {
		runWizard()
		return
	}

	if err := os.MkdirAll(filepath.Dir(dbPath), os.ModePerm); err != nil {
		log.Fatal(err)
	}

	if err := repository.InitDB(dbPath); err != nil {
		log.Fatal(err)
	}
	defer repository.CloseDB()

	e := echo.New()
	e.HideBanner = true

	e.Use(echoMiddleware.Recover())
	e.Use(echoMiddleware.CORSWithConfig(echoMiddleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{http.MethodGet, http.MethodHead, http.MethodPut, http.MethodPatch, http.MethodPost, http.MethodDelete},
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
	}))

	e.GET("/api/health", func(c echo.Context) error {
		return c.JSON(200, map[string]string{"status": "ok"})
	})

	clerkKey := os.Getenv("CLERK_SECRET_KEY")
	if clerkKey == "" {
		log.Println("WARNING: CLERK_SECRET_KEY not set, API routes will be unprotected")
	}

	var authMiddleware echo.MiddlewareFunc
	if clerkKey != "" && os.Getenv("ALLOW_UNAUTHENTICATED") != "1" {
		authMiddleware = middleware.ClerkAuth()
	}

	api := e.Group("/api")
	if authMiddleware != nil {
		api.Use(authMiddleware)
	}

	setupRoutes(api)

	e.GET("/home/*", echo.WrapHandler(http.StripPrefix("/home/", http.FileServer(getFileSystem()))))
	e.GET("/assets/*", echo.WrapHandler(http.StripPrefix("/assets/", http.FileServer(getFileSystem()))))
	e.GET("/loans/*", echo.WrapHandler(http.StripPrefix("/loans/", http.FileServer(getFileSystem()))))
	e.GET("/notifications/*", echo.WrapHandler(http.StripPrefix("/notifications/", http.FileServer(getFileSystem()))))
	e.GET("/reports/*", echo.WrapHandler(http.StripPrefix("/reports/", http.FileServer(getFileSystem()))))
	e.GET("/audit-logs/*", echo.WrapHandler(http.StripPrefix("/audit-logs/", http.FileServer(getFileSystem()))))
	e.GET("/import-export/*", echo.WrapHandler(http.StripPrefix("/import-export/", http.FileServer(getFileSystem()))))
	e.GET("/mass-label-print/*", echo.WrapHandler(http.StripPrefix("/mass-label-print/", http.FileServer(getFileSystem()))))
	e.GET("/maintenance/*", echo.WrapHandler(http.StripPrefix("/maintenance/", http.FileServer(getFileSystem()))))
	e.GET("/maintenance-label-print/*", echo.WrapHandler(http.StripPrefix("/maintenance-label-print/", http.FileServer(getFileSystem()))))
	e.GET("/master-data/*", echo.WrapHandler(http.StripPrefix("/master-data/", http.FileServer(getFileSystem()))))
	e.GET("/settings/*", echo.WrapHandler(http.StripPrefix("/settings/", http.FileServer(getFileSystem()))))
	e.GET("/public/*", echo.WrapHandler(http.StripPrefix("/public/", http.FileServer(getFileSystem()))))

	e.GET("/*", func(c echo.Context) error {
		path := c.PathParam("*")
		if path == "" || path == "/" {
			content, err := staticFiles.ReadFile("dist/index.html")
			if err != nil {
				return c.String(404, "Frontend not built")
			}
			return c.HTMLBlob(200, content)
		}
		filePath := filepath.Join("dist", path)
		content, err := staticFiles.ReadFile(filePath)
		if err == nil {
			return c.Blob(200, detectContentType(path), content)
		}
		content, err = staticFiles.ReadFile("dist/index.html")
		if err != nil {
			return c.String(404, "Frontend not built")
		}
		return c.HTMLBlob(200, content)
	})

	e.Static("/uploads", "./uploads")

	log.Printf("LabAsset Manager starting on port %s", port)
	log.Printf("Database: %s", dbPath)
	log.Printf("Access: http://localhost:%s", port)

	if err := e.Start(":" + port); err != nil {
		log.Fatal(err)
	}
}

func getFileSystem() http.FileSystem {
	files, _ := fs.Sub(staticFiles, "dist")
	return http.FS(files)
}

func detectContentType(path string) string {
	ext := strings.ToLower(filepath.Ext(path))
	switch ext {
	case ".html": return "text/html"
	case ".js": return "application/javascript"
	case ".css": return "text/css"
	case ".png": return "image/png"
	case ".jpg", ".jpeg": return "image/jpeg"
	case ".svg": return "image/svg+xml"
	case ".ico": return "image/x-icon"
	case ".woff": return "font/woff"
	case ".woff2": return "font/woff2"
	case ".ttf": return "font/ttf"
	default: return "application/octet-stream"
	}
}

func setupRoutes(api *echo.Group) {
	userHandler := handler.NewUserHandler()
	api.GET("/me", userHandler.GetCurrentUser)

	catHandler := handler.NewCategoryHandler()
	api.GET("/categories", catHandler.GetAll)
	api.GET("/categories/:id", catHandler.GetByID)
	api.POST("/categories", catHandler.Create)
	api.PUT("/categories/:id", catHandler.Update)
	api.DELETE("/categories/:id", catHandler.Delete)

	budgetHandler := handler.NewBudgetSourceHandler()
	api.GET("/budget-sources", budgetHandler.GetAll)
	api.GET("/budget-sources/:id", budgetHandler.GetByID)
	api.POST("/budget-sources", budgetHandler.Create)
	api.PUT("/budget-sources/:id", budgetHandler.Update)
	api.DELETE("/budget-sources/:id", budgetHandler.Delete)

	locationHandler := handler.NewLocationHandler()
	api.GET("/locations", locationHandler.GetAll)
	api.GET("/locations/:id", locationHandler.GetByID)
	api.POST("/locations", locationHandler.Create)
	api.PUT("/locations/:id", locationHandler.Update)
	api.DELETE("/locations/:id", locationHandler.Delete)

	assetHandler := handler.NewAssetHandler()
	api.GET("/assets", assetHandler.GetAll)
	api.GET("/assets/:id", assetHandler.GetByID)
	api.POST("/assets", assetHandler.Create)
	api.PUT("/assets/:id", assetHandler.Update)
	api.DELETE("/assets/:id", assetHandler.Delete)

	uploadHandler := handler.NewUploadHandler()
	api.POST("/upload", uploadHandler.Upload)

	maintHandler := handler.NewMaintenanceLogHandler()
	api.GET("/assets/:assetId/maintenance-logs", maintHandler.GetByAssetID)
	api.POST("/assets/:assetId/maintenance-logs", maintHandler.Create)
	api.DELETE("/maintenance-logs/:id", maintHandler.Delete)
	api.GET("/maintenance-logs", maintHandler.GetAll)

	maintLabelHandler := handler.NewMaintenanceLabelHandler()
	api.GET("/maintenance-labels/:id", maintLabelHandler.GenerateLabel)
	api.GET("/maintenance-labels-bulk/print", maintLabelHandler.GenerateBulkLabels)

	upgradeHandler := handler.NewUpgradeLogHandler()
	api.GET("/assets/:assetId/upgrade-logs", upgradeHandler.GetByAssetID)
	api.POST("/assets/:assetId/upgrade-logs", upgradeHandler.Create)
	api.DELETE("/upgrade-logs/:id", upgradeHandler.Delete)

	qrHandler := handler.NewQRCodeHandler()
	api.GET("/assets/:id/qrcode", qrHandler.Generate)

	labelHandler := handler.NewLabelHandler()
	api.GET("/assets/:id/label/pdf", labelHandler.GeneratePDF)

	statsHandler := handler.NewStatsHandler()
	api.GET("/stats/dashboard", statsHandler.GetDashboard)

	auditHandler := handler.NewAuditLogHandler()
	api.GET("/audit-logs", auditHandler.GetAll)

	notifHandler := handler.NewNotificationHandler()
	api.GET("/notifications/summary", notifHandler.GetSummary)
	api.GET("/notifications/warranty", notifHandler.GetWarrantyAlerts)
	api.GET("/notifications/broken-assets", notifHandler.GetBrokenAssets)

	exportHandler := handler.NewExportHandler()
	api.GET("/export/assets/csv", exportHandler.ExportCSV)

	reportHandler := handler.NewReportHandler()
	api.GET("/reports", reportHandler.GenerateReport)

	bulkHandler := handler.NewBulkHandler()
	api.POST("/assets/bulk/update-condition", bulkHandler.BulkUpdateCondition)
	api.POST("/assets/bulk/delete", bulkHandler.BulkDelete)
	api.POST("/assets/bulk/update-location", bulkHandler.BulkUpdateLocation)
	api.GET("/assets/bulk/export", bulkHandler.BulkExport)

	importHandler := handler.NewImportHandler()
	api.POST("/import/assets/csv", importHandler.ImportCSV)

	loanHandler := handler.NewLoanHandler()
	api.POST("/loans", loanHandler.Create)
	api.GET("/loans", loanHandler.GetAll)
	api.GET("/loans/active", loanHandler.GetActiveLoans)
	api.GET("/loans/overdue", loanHandler.GetOverdueLoans)
	api.GET("/loans/:id", loanHandler.GetByID)
	api.PUT("/loans/:id/return", loanHandler.Return)
	api.GET("/assets/available", loanHandler.GetAvailableAssets)
	api.GET("/loans/stats", loanHandler.GetStats)

	depreciationHandler := handler.NewDepreciationHandler()
	api.GET("/assets/:id/depreciation", depreciationHandler.GetAssetDepreciation)
	api.GET("/depreciations", depreciationHandler.GetAllDepreciations)

	codeHandler := handler.NewCodeHandler()
	api.GET("/assets/generate-code", codeHandler.GenerateCode)

	quickLoanHandler := handler.NewQuickLoanHandler()
	api.POST("/loans/quick", quickLoanHandler.CreateQuickLoan)

	settingsHandler := handler.NewSettingsHandler()
	api.GET("/settings", settingsHandler.GetSettings)
	api.PUT("/settings", settingsHandler.UpdateSettings)
	api.POST("/settings/logo", settingsHandler.UploadLogo)
	api.GET("/public/settings", settingsHandler.GetPublicSettings)
}

func runWizard() {
	fmt.Println("========================================================")
	fmt.Println("     LabAsset Manager - Installation Wizard")
	fmt.Println("========================================================")
	fmt.Println()

	port := promptInput("Enter port number", "8080")
	dbPath := promptInput("Enter database path", "./data/lab_asset.db")
	clerkKey := promptInput("Enter Clerk Secret Key (optional)", "")
	allowUnauth := promptInput("Allow unauthenticated access? (yes/no)", "no")

	envContent := fmt.Sprintf("PORT=%s\nDB_PATH=%s\n", port, dbPath)
	if clerkKey != "" {
		envContent += fmt.Sprintf("CLERK_SECRET_KEY=%s\n", clerkKey)
	}
	if strings.ToLower(allowUnauth) == "yes" {
		envContent += "ALLOW_UNAUTHENTICATED=1\n"
	}

	err := os.WriteFile(".env", []byte(envContent), 0644)
	if err != nil {
		log.Fatal("Failed to write .env file:", err)
	}

	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		log.Fatal("Failed to create data directory:", err)
	}

	if err := repository.InitDB(dbPath); err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer repository.CloseDB()

	fmt.Println()
	fmt.Println("========================================================")
	fmt.Println("          Installation Complete!")
	fmt.Println("========================================================")
	fmt.Println()
	fmt.Printf("Database: %s\n", dbPath)
	fmt.Printf("Port:     %s\n", port)
	fmt.Println()
	fmt.Println("To start the server, run: ./lab-asset-manager")
	fmt.Printf("Access the application at: http://localhost:%s\n", port)
	fmt.Println()
}

func promptInput(prompt, defaultValue string) string {
	fmt.Print(prompt)
	if defaultValue != "" {
		fmt.Printf(" [%s]", defaultValue)
	}
	fmt.Print(": ")
	var input string
	fmt.Scanln(&input)
	if input == "" {
		input = defaultValue
	}
	return strings.TrimSpace(input)
}
SERVEREOF

# Create README for deployment
cat > "$DEPLOY_DIR/README.md" << 'READMEEOF'
# LabAsset Manager - Deployment

## Requirements
- Go 1.21+ (for building from source)
- OR use pre-built binary

## Quick Start

### Option 1: Wizard Installer (Recommended)
1. Extract this archive
2. Run: `INSTALL_MODE=wizard ./lab-asset-manager`
3. Follow the wizard instructions
4. Access at http://localhost:PORT

### Option 2: Manual Setup
1. Create `.env` file:
```
PORT=8080
DB_PATH=./data/lab_asset.db
ALLOW_UNAUTHENTICATED=1
```
2. Create data folder: `mkdir -p data`
3. Run: `./lab-asset-manager`

## First Time Setup
1. Run the application
2. Go to Settings > Label Settings to configure label layouts
3. Add categories, locations, budget sources in Master Data
4. Start adding assets!

## Port Configuration
Edit `.env` file:
```
PORT=3000
```
Then restart the application.

## File Structure
```
.
├── lab-asset-manager  (or .exe on Windows)
├── .env               (configuration)
├── data/              (SQLite database - auto created)
└── uploads/          (uploaded files - auto created)
```

## Troubleshooting
- If port is already in use, change PORT in .env
- If database error, ensure write permission to data folder
- Check logs for detailed error messages
READMEEOF

# Create folder structure
mkdir -p "$DEPLOY_DIR/data"
mkdir -p "$DEPLOY_DIR/uploads"

# Create initial .env.example
cat > "$DEPLOY_DIR/.env.example" << 'ENVEOF'
PORT=8080
DB_PATH=./data/lab_asset.db
# CLERK_SECRET_KEY=your_key_here
# ALLOW_UNAUTHENTICATED=1
ENVEOF

echo "[5/5] Creating build scripts..."

# Create Windows build script
cat > "$DEPLOY_DIR/build-windows.bat" << 'BATEOF'
@echo off
echo Building LabAsset Manager for Windows...
cd /d "%~dp0\.."
GOOS=windows GOARCH=amd64 go build -ldflags="-s -w" -o deploy/lab-asset-manager.exe ./cmd/server
echo Build complete: deploy/lab-asset-manager.exe
BATEOF

# Create Linux build script
cat > "$DEPLOY_DIR/build-linux.sh" << 'BASHEOF'
#!/bin/bash
echo "Building LabAsset Manager for Linux..."
cd "$(dirname "$0")/.."
GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o deploy/lab-asset-manager ./cmd/server
chmod +x deploy/lab-asset-manager
echo "Build complete: deploy/lab-asset-manager"
BASHEOF
chmod +x "$DEPLOY_DIR/build-linux.sh"

# Create start script
cat > "$DEPLOY_DIR/start.sh" << 'STARTEOF'
#!/bin/bash
cd "$(dirname "$0")"
./lab-asset-manager
STARTEOF
chmod +x "$DEPLOY_DIR/start.sh"

# Create start.bat for Windows
cat > "$DEPLOY_DIR/start.bat" << 'STARTBATEOF'
@echo off
cd /d "%~dp0"
start "" lab-asset-manager.exe
STARTBATEOF

# Create installer wizard script
cat > "$DEPLOY_DIR/install-wizard.sh" << 'WIZARDEOF'
#!/bin/bash
cd "$(dirname "$0")"
INSTALL_MODE=wizard ./lab-asset-manager
WIZARDEOF
chmod +x "$DEPLOY_DIR/install-wizard.sh"

echo ""
echo "========================================"
echo "  Deployment files created successfully!"
echo "========================================"
echo ""
echo "Location: $DEPLOY_DIR"
echo ""
echo "Contents:"
ls -la "$DEPLOY_DIR"
echo ""
echo "Next steps:"
echo "1. Build the binary:"
echo "   - Windows: run build-windows.bat"
echo "   - Linux: ./build-linux.sh"
echo ""
echo "2. Run installer:"
echo "   - Windows: install-wizard.bat (edit install-wizard.sh first)"
echo "   - Linux: ./install-wizard.sh"
echo ""
echo "3. Start application:"
echo "   - ./start.sh (Linux)"
echo "   - start.bat (Windows)"
echo ""
