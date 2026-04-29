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

//go:embed dist/* migrations/*
var staticFiles embed.FS

//go:embed migrations
var migrationsFS embed.FS

func init() {
	// Extract embedded files to temp directory for runtime access
	extractEmbeddings()
	repository.InitMigrationsFS(migrationsFS)
}

func extractEmbeddings() {
	// Get temp directory based on executable location
	ex, err := os.Executable()
	if err != nil {
		log.Println("Warning: could not determine executable path")
		return
	}
	dir := filepath.Dir(ex)
	tempDir := filepath.Join(dir, "labasset-extracted")

	// Create temp directory
	if err := os.MkdirAll(tempDir, 0755); err != nil {
		log.Printf("Warning: could not create temp dir: %v", err)
		return
	}

	// Extract dist folder
	extractDir(staticFiles, "dist", filepath.Join(tempDir, "dist"))

	// Extract migrations folder
	extractDir(migrationsFS, "migrations", filepath.Join(tempDir, "migrations"))

	log.Printf("Extracted embedded files to: %s", tempDir)
}

func extractDir(fs embed.FS, srcDir, destDir string) error {
	entries, err := fs.ReadDir(srcDir)
	if err != nil {
		return err
	}

	if err := os.MkdirAll(destDir, 0755); err != nil {
		return err
	}

	for _, e := range entries {
		if e.IsDir() {
			continue
		}

		data, err := fs.ReadFile(filepath.Join(srcDir, e.Name()))
		if err != nil {
			continue
		}

		destFile := filepath.Join(destDir, e.Name())
		if err := os.WriteFile(destFile, data, 0644); err != nil {
			log.Printf("Warning: could not extract %s: %v", e.Name(), err)
		}
	}

	return nil
}

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

	e.Use(echoMiddleware.Recover())
	e.Use(echoMiddleware.CORSWithConfig(echoMiddleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{http.MethodGet, http.MethodHead, http.MethodPut, http.MethodPatch, http.MethodPost, http.MethodDelete},
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
	}))

	e.GET("/api/health", func(c *echo.Context) error {
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

	// Serve static files from extracted directory
	serveStatic(e)

	e.Static("/uploads", "./uploads")

	log.Printf("LabAsset Manager starting on port %s", port)
	log.Printf("Database: %s", dbPath)
	log.Printf("Access: http://localhost:%s", port)

	if err := e.Start(":" + port); err != nil {
		log.Fatal(err)
	}
}

func serveStatic(e *echo.Echo) {
	// Get the directory where the executable is located
	ex, err := os.Executable()
	if err != nil {
		log.Fatal("Could not determine executable path")
	}
	dir := filepath.Dir(ex)
	extractedDir := filepath.Join(dir, "labasset-extracted", "dist")

	// Check if extracted files exist
	if _, err := os.Stat(extractedDir); os.IsNotExist(err) {
		// Fallback to embedded
		log.Println("Warning: extracted files not found, using embedded")
		serveEmbedded(e)
		return
	}

	// Serve from extracted directory
	fs := http.Dir(extractedDir)
	e.GET("/home/*", echo.WrapHandler(http.StripPrefix("/home/", http.FileServer(fs))))
	e.GET("/assets/*", echo.WrapHandler(http.StripPrefix("/assets/", http.FileServer(fs))))
	e.GET("/loans/*", echo.WrapHandler(http.StripPrefix("/loans/", http.FileServer(fs))))
	e.GET("/notifications/*", echo.WrapHandler(http.StripPrefix("/notifications/", http.FileServer(fs))))
	e.GET("/reports/*", echo.WrapHandler(http.StripPrefix("/reports/", http.FileServer(fs))))
	e.GET("/audit-logs/*", echo.WrapHandler(http.StripPrefix("/audit-logs/", http.FileServer(fs))))
	e.GET("/import-export/*", echo.WrapHandler(http.StripPrefix("/import-export/", http.FileServer(fs))))
	e.GET("/mass-label-print/*", echo.WrapHandler(http.StripPrefix("/mass-label-print/", http.FileServer(fs))))
	e.GET("/maintenance/*", echo.WrapHandler(http.StripPrefix("/maintenance/", http.FileServer(fs))))
	e.GET("/maintenance-label-print/*", echo.WrapHandler(http.StripPrefix("/maintenance-label-print/", http.FileServer(fs))))
	e.GET("/master-data/*", echo.WrapHandler(http.StripPrefix("/master-data/", http.FileServer(fs))))
	e.GET("/settings/*", echo.WrapHandler(http.StripPrefix("/settings/", http.FileServer(fs))))
	e.GET("/public/*", echo.WrapHandler(http.StripPrefix("/public/", http.FileServer(fs))))

	e.GET("/*", echo.WrapHandler(http.FileServer(fs)))
}

func serveEmbedded(e *echo.Echo) {
	fs := getFileSystem()
	e.GET("/home/*", echo.WrapHandler(http.StripPrefix("/home/", http.FileServer(fs))))
	e.GET("/assets/*", echo.WrapHandler(http.StripPrefix("/assets/", http.FileServer(fs))))
	e.GET("/loans/*", echo.WrapHandler(http.StripPrefix("/loans/", http.FileServer(fs))))
	e.GET("/notifications/*", echo.WrapHandler(http.StripPrefix("/notifications/", http.FileServer(fs))))
	e.GET("/reports/*", echo.WrapHandler(http.StripPrefix("/reports/", http.FileServer(fs))))
	e.GET("/audit-logs/*", echo.WrapHandler(http.StripPrefix("/audit-logs/", http.FileServer(fs))))
	e.GET("/import-export/*", echo.WrapHandler(http.StripPrefix("/import-export/", http.FileServer(fs))))
	e.GET("/mass-label-print/*", echo.WrapHandler(http.StripPrefix("/mass-label-print/", http.FileServer(fs))))
	e.GET("/maintenance/*", echo.WrapHandler(http.StripPrefix("/maintenance/", http.FileServer(fs))))
	e.GET("/maintenance-label-print/*", echo.WrapHandler(http.StripPrefix("/maintenance-label-print/", http.FileServer(fs))))
	e.GET("/master-data/*", echo.WrapHandler(http.StripPrefix("/master-data/", http.FileServer(fs))))
	e.GET("/settings/*", echo.WrapHandler(http.StripPrefix("/settings/", http.FileServer(fs))))
	e.GET("/public/*", echo.WrapHandler(http.StripPrefix("/public/", http.FileServer(fs))))

	e.GET("/*", func(c *echo.Context) error {
		path := c.Param("*")
		filePath := filepath.Join("dist", path)
		content, err := staticFiles.ReadFile(filePath)
		if err != nil {
			content, _ = staticFiles.ReadFile("dist/index.html")
		}
		return c.HTMLBlob(200, content)
	})
}

func getFileSystem() http.FileSystem {
	myfs, _ := fs.Sub(staticFiles, "dist")
	return http.FS(myfs)
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

	fmt.Println()
	fmt.Println("Installing...")

	// Step 1: Create .env file
	fmt.Print("  [1/4] Creating configuration file (.env)... ")
	envContent := fmt.Sprintf("PORT=%s\nDB_PATH=%s\n", port, dbPath)
	if clerkKey != "" {
		envContent += fmt.Sprintf("CLERK_SECRET_KEY=%s\n", clerkKey)
	}
	if strings.ToLower(allowUnauth) == "yes" {
		envContent += "ALLOW_UNAUTHENTICATED=1\n"
	}

	err := os.WriteFile(".env", []byte(envContent), 0644)
	if err != nil {
		fmt.Printf("FAILED!\n")
		fmt.Printf("  Error: Failed to write .env file: %v\n", err)
		fmt.Println()
		fmt.Println("========================================================")
		fmt.Println("          Installation FAILED!")
		fmt.Println("========================================================")
		fmt.Println()
		os.Exit(1)
	}
	fmt.Println("OK")

	// Step 2: Create data directory
	fmt.Print("  [2/4] Creating data directory... ")
	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		fmt.Printf("FAILED!\n")
		fmt.Printf("  Error: Failed to create directory: %v\n", err)
		fmt.Println()
		fmt.Println("========================================================")
		fmt.Println("          Installation FAILED!")
		fmt.Println("========================================================")
		fmt.Println()
		os.Exit(1)
	}
	fmt.Println("OK")

	// Step 3: Initialize database
	fmt.Print("  [3/4] Initializing database... ")
	if err := repository.InitDB(dbPath); err != nil {
		fmt.Printf("FAILED!\n")
		fmt.Printf("  Error: Failed to initialize database: %v\n", err)
		fmt.Println()
		fmt.Println("========================================================")
		fmt.Println("          Installation FAILED!")
		fmt.Println("========================================================")
		fmt.Println()
		os.Exit(1)
	}
	defer repository.CloseDB()
	fmt.Println("OK")

	// Step 4: Verify installation
	fmt.Print("  [4/4] Verifying installation... ")
	if _, err := os.Stat(".env"); err != nil {
		fmt.Printf("FAILED!\n")
		fmt.Printf("  Error: Configuration file not found\n")
		fmt.Println()
		fmt.Println("========================================================")
		fmt.Println("          Installation FAILED!")
		fmt.Println("========================================================")
		fmt.Println()
		os.Exit(1)
	}
	fmt.Println("OK")

	fmt.Println()
	fmt.Println("========================================================")
	fmt.Println("          Installation SUCCESS!")
	fmt.Println("========================================================")
	fmt.Println()
	fmt.Printf("  Database: %s\n", dbPath)
	fmt.Printf("  Port:     %s\n", port)
	fmt.Println()
	fmt.Println("  Next steps:")
	fmt.Println("    1. Run: ./start.sh (Linux) or start.bat (Windows)")
	fmt.Println("    2. Open browser: http://localhost:" + port)
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