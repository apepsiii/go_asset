package main

import (
	"log"
	"net/http"
	"os"

	"github.com/labstack/echo/v5"
	echoMiddleware "github.com/labstack/echo/v5/middleware"
	"lab-asset-manager/internal/handler"
	"lab-asset-manager/internal/repository"
)

func main() {
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

	e := echo.New()

	e.Use(echoMiddleware.Recover())
	e.Use(echoMiddleware.CORSWithConfig(echoMiddleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{http.MethodGet, http.MethodHead, http.MethodPut, http.MethodPatch, http.MethodPost, http.MethodDelete},
	}))

	e.GET("/api/health", func(c *echo.Context) error {
		return c.JSON(200, map[string]string{"status": "ok"})
	})

	catHandler := handler.NewCategoryHandler()
	e.GET("/api/categories", catHandler.GetAll)
	e.GET("/api/categories/:id", catHandler.GetByID)
	e.POST("/api/categories", catHandler.Create)
	e.PUT("/api/categories/:id", catHandler.Update)
	e.DELETE("/api/categories/:id", catHandler.Delete)

	budgetHandler := handler.NewBudgetSourceHandler()
	e.GET("/api/budget-sources", budgetHandler.GetAll)
	e.GET("/api/budget-sources/:id", budgetHandler.GetByID)
	e.POST("/api/budget-sources", budgetHandler.Create)
	e.PUT("/api/budget-sources/:id", budgetHandler.Update)
	e.DELETE("/api/budget-sources/:id", budgetHandler.Delete)

	locationHandler := handler.NewLocationHandler()
	e.GET("/api/locations", locationHandler.GetAll)
	e.GET("/api/locations/:id", locationHandler.GetByID)
	e.POST("/api/locations", locationHandler.Create)
	e.PUT("/api/locations/:id", locationHandler.Update)
	e.DELETE("/api/locations/:id", locationHandler.Delete)

	assetHandler := handler.NewAssetHandler()
	e.GET("/api/assets", assetHandler.GetAll)
	e.GET("/api/assets/:id", assetHandler.GetByID)
	e.POST("/api/assets", assetHandler.Create)
	e.PUT("/api/assets/:id", assetHandler.Update)
	e.DELETE("/api/assets/:id", assetHandler.Delete)

	uploadHandler := handler.NewUploadHandler()
	e.POST("/api/upload", uploadHandler.Upload)

	maintHandler := handler.NewMaintenanceLogHandler()
	e.GET("/api/assets/:assetId/maintenance-logs", maintHandler.GetByAssetID)
	e.POST("/api/assets/:assetId/maintenance-logs", maintHandler.Create)
	e.DELETE("/api/maintenance-logs/:id", maintHandler.Delete)

	upgradeHandler := handler.NewUpgradeLogHandler()
	e.GET("/api/assets/:assetId/upgrade-logs", upgradeHandler.GetByAssetID)
	e.POST("/api/assets/:assetId/upgrade-logs", upgradeHandler.Create)
	e.DELETE("/api/upgrade-logs/:id", upgradeHandler.Delete)

	qrHandler := handler.NewQRCodeHandler()
	e.GET("/api/assets/:id/qrcode", qrHandler.Generate)

	labelHandler := handler.NewLabelHandler()
	e.GET("/api/assets/:id/label/pdf", labelHandler.GeneratePDF)

	statsHandler := handler.NewStatsHandler()
	e.GET("/api/stats/dashboard", statsHandler.GetDashboard)

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
