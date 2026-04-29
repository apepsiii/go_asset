@echo off
REM ============================================================
REM LabAsset Manager - Build Server Binary Only
REM ============================================================
REM This script builds ONLY the Go binary (no React build)
REM Use this if React is already built
REM ============================================================

echo Building LabAsset Manager Server Binary...
echo.

REM Check if Go is installed
where go >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: Go is not installed or not in PATH
    echo Download from: https://go.dev/dl/
    pause
    exit /b 1
)

REM Create server directory
if not exist "cmd\server" mkdir cmd\server

echo Creating cmd\server\main.go...

REM Use PowerShell to write the full main.go
powershell -Command @"
\$mainGo = @'
package main

import (
	\"embed\"
	\"fmt\"
	\"io/fs\"
	\"log\"
	\"net/http\"
	\"os\"
	\"path/filepath\"
	\"strings\"

	\"github.com/joho/godotenv\"
	\"github.com/labstack/echo/v5\"
	echoMiddleware \"github.com/labstack/echo/v5/middleware\"
	\"lab-asset-manager/internal/handler\"
	\"lab-asset-manager/internal/middleware\"
	\"lab-asset-manager/internal/repository\"
)

//go:embed all:dist
var staticFiles embed.FS

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println(\"Note: .env file not found\")
	}

	dbPath := os.Getenv(\"DB_PATH\")
	if dbPath == \"\" {
		dbPath = \"./data/lab_asset.db\"
	}

	port := os.Getenv(\"PORT\")
	if port == \"\" {
		port = \"8080\"
	}

	installMode := os.Getenv(\"INSTALL_MODE\")
	if installMode == \"wizard\" {
		runWizard()
		return
	}

	os.MkdirAll(filepath.Dir(dbPath), os.ModePerm)
	repository.InitDB(dbPath)
	defer repository.CloseDB()

	e := echo.New()
	e.HideBanner = true
	e.Use(echoMiddleware.Recover())
	e.Use(echoMiddleware.CORSWithConfig(echoMiddleware.CORSConfig{
		AllowOrigins: []string{\"*\"},
		AllowMethods: []string{http.MethodGet, http.MethodHead, http.MethodPut, http.MethodPatch, http.MethodPost, http.MethodDelete},
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
	}))

	e.GET(\"/api/health\", func(c echo.Context) error {
		return c.JSON(200, map[string]string{\"status\": \"ok\"})
	})

	clerkKey := os.Getenv(\"CLERK_SECRET_KEY\")
	var authMiddleware echo.MiddlewareFunc
	if clerkKey != \"\" && os.Getenv(\"ALLOW_UNAUTHENTICATED\") != \"1\" {
		authMiddleware = middleware.ClerkAuth()
	}

	api := e.Group(\"/api\")
	if authMiddleware != nil {
		api.Use(authMiddleware)
	}

	setupRoutes(api)
	serveStatic(e)
	e.Static(\"/uploads\", \"./uploads\")

	log.Printf(\"LabAsset Manager starting on port %s\", port)
	log.Printf(\"Database: %s\", dbPath)
	e.Start(\":\" + port)
}

func getFileSystem() http.FileSystem {
	files, _ := fs.Sub(staticFiles, \"dist\")
	return http.FS(files)
}

func serveStatic(e *echo.Echo) {
	paths := []string{\"home\", \"assets\", \"loans\", \"notifications\", \"reports\",
		\"audit-logs\", \"import-export\", \"mass-label-print\", \"maintenance\",
		\"maintenance-label-print\", \"master-data\", \"settings\", \"public\"}
	for _, p := range paths {
		e.GET(\"/\" + p + \"/*\", echo.WrapHandler(http.StripPrefix(\"/\"+p+\"/\", http.FileServer(getFileSystem()))))
	}
	e.GET(\"/*\", func(c echo.Context) error {
		path := c.PathParam(\"*\")
		content, err := staticFiles.ReadFile(filepath.Join(\"dist\", path))
		if err != nil {
			content, _ = staticFiles.ReadFile(\"dist/index.html\")
		}
		return c.HTMLBlob(200, content)
	})
}

func setupRoutes(api *echo.Group) {
	api.GET(\"/me\", handler.NewUserHandler().GetCurrentUser)
	cat := handler.NewCategoryHandler()
	api.GET(\"/categories\", cat.GetAll)
	api.GET(\"/categories/:id\", cat.GetByID)
	api.POST(\"/categories\", cat.Create)
	api.PUT(\"/categories/:id\", cat.Update)
	api.DELETE(\"/categories/:id\", cat.Delete)
	budget := handler.NewBudgetSourceHandler()
	api.GET(\"/budget-sources\", budget.GetAll)
	api.GET(\"/budget-sources/:id\", budget.GetByID)
	api.POST(\"/budget-sources\", budget.Create)
	api.PUT(\"/budget-sources/:id\", budget.Update)
	api.DELETE(\"/budget-sources/:id\", budget.Delete)
	loc := handler.NewLocationHandler()
	api.GET(\"/locations\", loc.GetAll)
	api.GET(\"/locations/:id\", loc.GetByID)
	api.POST(\"/locations\", loc.Create)
	api.PUT(\"/locations/:id\", loc.Update)
	api.DELETE(\"/locations/:id\", loc.Delete)
	asset := handler.NewAssetHandler()
	api.GET(\"/assets\", asset.GetAll)
	api.GET(\"/assets/:id\", asset.GetByID)
	api.POST(\"/assets\", asset.Create)
	api.PUT(\"/assets/:id\", asset.Update)
	api.DELETE(\"/assets/:id\", asset.Delete)
	api.POST(\"/upload\", handler.NewUploadHandler().Upload)
	maint := handler.NewMaintenanceLogHandler()
	api.GET(\"/assets/:assetId/maintenance-logs\", maint.GetByAssetID)
	api.POST(\"/assets/:assetId/maintenance-logs\", maint.Create)
	api.DELETE(\"/maintenance-logs/:id\", maint.Delete)
	api.GET(\"/maintenance-logs\", maint.GetAll)
	maintLabel := handler.NewMaintenanceLabelHandler()
	api.GET(\"/maintenance-labels/:id\", maintLabel.GenerateLabel)
	api.GET(\"/maintenance-labels-bulk/print\", maintLabel.GenerateBulkLabels)
	upgrade := handler.NewUpgradeLogHandler()
	api.GET(\"/assets/:assetId/upgrade-logs\", upgrade.GetByAssetID)
	api.POST(\"/assets/:assetId/upgrade-logs\", upgrade.Create)
	api.DELETE(\"/upgrade-logs/:id\", upgrade.Delete)
	api.GET(\"/assets/:id/qrcode\", handler.NewQRCodeHandler().Generate)
	api.GET(\"/assets/:id/label/pdf\", handler.NewLabelHandler().GeneratePDF)
	api.GET(\"/stats/dashboard\", handler.NewStatsHandler().GetDashboard)
	api.GET(\"/audit-logs\", handler.NewAuditLogHandler().GetAll)
	notif := handler.NewNotificationHandler()
	api.GET(\"/notifications/summary\", notif.GetSummary)
	api.GET(\"/notifications/warranty\", notif.GetWarrantyAlerts)
	api.GET(\"/notifications/broken-assets\", notif.GetBrokenAssets)
	api.GET(\"/export/assets/csv\", handler.NewExportHandler().ExportCSV)
	api.GET(\"/reports\", handler.NewReportHandler().GenerateReport)
	bulk := handler.NewBulkHandler()
	api.POST(\"/assets/bulk/update-condition\", bulk.BulkUpdateCondition)
	api.POST(\"/assets/bulk/delete\", bulk.BulkDelete)
	api.POST(\"/assets/bulk/update-location\", bulk.BulkUpdateLocation)
	api.GET(\"/assets/bulk/export\", bulk.BulkExport)
	api.POST(\"/import/assets/csv\", handler.NewImportHandler().ImportCSV)
	loan := handler.NewLoanHandler()
	api.POST(\"/loans\", loan.Create)
	api.GET(\"/loans\", loan.GetAll)
	api.GET(\"/loans/active\", loan.GetActiveLoans)
	api.GET(\"/loans/overdue\", loan.GetOverdueLoans)
	api.GET(\"/loans/:id\", loan.GetByID)
	api.PUT(\"/loans/:id/return\", loan.Return)
	api.GET(\"/assets/available\", loan.GetAvailableAssets)
	api.GET(\"/loans/stats\", loan.GetStats)
	depr := handler.NewDepreciationHandler()
	api.GET(\"/assets/:id/depreciation\", depr.GetAssetDepreciation)
	api.GET(\"/depreciations\", depr.GetAllDepreciations)
	api.GET(\"/assets/generate-code\", handler.NewCodeHandler().GenerateCode)
	api.POST(\"/loans/quick\", handler.NewQuickLoanHandler().CreateQuickLoan)
	settings := handler.NewSettingsHandler()
	api.GET(\"/settings\", settings.GetSettings)
	api.PUT(\"/settings\", settings.UpdateSettings)
	api.POST(\"/settings/logo\", settings.UploadLogo)
	api.GET(\"/public/settings\", settings.GetPublicSettings)
}

func runWizard() {
	fmt.Println(\"========================================================\")
	fmt.Println(\"     LabAsset Manager - Installation Wizard\")
	fmt.Println(\"========================================================\")
	fmt.Println()

	var port, dbPath, clerkKey, allowUnauth string
	fmt.Print(\"Enter port number [8080]: \")
	fmt.Scanln(&port)
	if port == \"\" { port = \"8080\" }
	fmt.Print(\"Enter database path [./data/lab_asset.db]: \")
	fmt.Scanln(&dbPath)
	if dbPath == \"\" { dbPath = \"./data/lab_asset.db\" }
	fmt.Print(\"Enter Clerk Secret Key (optional): \")
	fmt.Scanln(&clerkKey)
	fmt.Print(\"Allow unauthenticated access? (yes/no) [no]: \")
	fmt.Scanln(&allowUnauth)

	envContent := fmt.Sprintf(\"PORT=%s\nDB_PATH=%s\n\", port, dbPath)
	if clerkKey != \"\" {
		envContent += \"CLERK_SECRET_KEY=\" + clerkKey + \"\n\"
	}
	if strings.ToLower(allowUnauth) == \"yes\" {
		envContent += \"ALLOW_UNAUTHENTICATED=1\n\"
	}

	os.WriteFile(\".env\", []byte(envContent), 0644)
	os.MkdirAll(filepath.Dir(dbPath), 0755)
	repository.InitDB(dbPath)
	defer repository.CloseDB()

	fmt.Println()
	fmt.Println(\"========================================================\")
	fmt.Println(\"          Installation Complete!\")
	fmt.Println(\"========================================================\")
	fmt.Printf(\"Database: %s\n\", dbPath)
	fmt.Printf(\"Port: %s\n\", port)
	fmt.Println(\"Run ./lab-asset-manager to start\")
}
'@
\$mainGo | Out-File -FilePath \"cmd\server\main.go\" -Encoding UTF8
"@

echo Building Go binary...
go build -ldflags="-s -w" -o lab-asset-manager.exe ./cmd/server

if %ERRORLEVEL% neq 0 (
    echo.
    echo ERROR: Build failed!
    echo Make sure:
    echo 1. web/dist folder exists (run 'npm run build' in web folder first)
    echo 2. All Go dependencies are installed
    pause
    exit /b 1
)

echo.
echo ========================================================
echo   Build Successful!
echo ========================================================
echo.
echo Binary: lab-asset-manager.exe
echo.
pause
