package main

import (
	"log"
	"net/http"
	"os"

	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/joho/godotenv"
	"github.com/labstack/echo/v5"
	echoMiddleware "github.com/labstack/echo/v5/middleware"
	"lab-asset-manager/internal/handler"
	"lab-asset-manager/internal/middleware"
	"lab-asset-manager/internal/repository"
)

func main() {
	// Load .env file
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: .env file not found, using system environment variables")
	}

	// Log environment status for debugging
	if os.Getenv("ALLOW_UNAUTHENTICATED") == "1" {
		log.Println("INFO: Running in UNPROTECTED mode (ALLOW_UNAUTHENTICATED=1)")
	}

	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "./data/lab_asset.db"
	}

	if err := os.MkdirAll("./data", os.ModePerm); err != nil {
		log.Fatal(err)
	}

	if err := repository.InitDB(dbPath); err != nil {
		log.Fatal(err)
	}
	defer repository.CloseDB()

	clerkKey := os.Getenv("CLERK_SECRET_KEY")
	if clerkKey == "" {
		log.Println("WARNING: CLERK_SECRET_KEY not set, API routes will be unprotected")
	}
	clerk.SetKey(clerkKey)

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

	var authMiddleware echo.MiddlewareFunc
	if clerkKey != "" {
		authMiddleware = middleware.ClerkAuth()
	}

	api := e.Group("/api")
	if authMiddleware != nil {
		api.Use(authMiddleware)
	}

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

	// Loan routes
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
	e.GET("/api/public/settings", settingsHandler.GetPublicSettings)

	e.Static("/uploads", "./uploads")

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := e.Start(":" + port); err != nil {
		log.Fatal(err)
	}
}
