package handler

import (
	"net/http"

	"github.com/labstack/echo/v5"
	"lab-asset-manager/internal/repository"
)

type StatsHandler struct{}

func NewStatsHandler() *StatsHandler {
	return &StatsHandler{}
}

type DashboardStats struct {
	TotalAssets      int            `json:"total_assets"`
	OKCount          int            `json:"ok_count"`
	RusakRinganCount int            `json:"rusak_ringan_count"`
	RusakTotalCount  int            `json:"rusak_total_count"`
	MaintenanceCount int            `json:"maintenance_count"`
	TotalValue       float64        `json:"total_value"`
	ByCategory       []CategoryStat `json:"by_category"`
	ByLocation       []LocationStat `json:"by_location"`
	ByBudgetSource   []BudgetStat   `json:"by_budget_source"`
}

type CategoryStat struct {
	Name  string `json:"name"`
	Count int    `json:"count"`
}

type LocationStat struct {
	Name  string `json:"name"`
	Count int    `json:"count"`
}

type BudgetStat struct {
	Name  string  `json:"name"`
	Count int     `json:"count"`
	Value float64 `json:"total_value"`
}

func (h *StatsHandler) GetDashboard(c *echo.Context) error {
	var stats DashboardStats

	// Total assets
	repository.DB.QueryRow("SELECT COUNT(*) FROM assets").Scan(&stats.TotalAssets)

	// Count by condition
	repository.DB.QueryRow("SELECT COUNT(*) FROM assets WHERE condition = 'OK'").Scan(&stats.OKCount)
	repository.DB.QueryRow("SELECT COUNT(*) FROM assets WHERE condition = 'RUSAK_RINGAN'").Scan(&stats.RusakRinganCount)
	repository.DB.QueryRow("SELECT COUNT(*) FROM assets WHERE condition = 'RUSAK_TOTAL'").Scan(&stats.RusakTotalCount)
	repository.DB.QueryRow("SELECT COUNT(*) FROM assets WHERE condition = 'MAINTENANCE'").Scan(&stats.MaintenanceCount)

	// Total value
	repository.DB.QueryRow("SELECT COALESCE(SUM(price), 0) FROM assets").Scan(&stats.TotalValue)

	// By Category
	rows, err := repository.DB.Query(`
		SELECT c.name, COUNT(a.id) 
		FROM categories c 
		LEFT JOIN assets a ON c.id = a.category_id 
		GROUP BY c.id, c.name 
		ORDER BY COUNT(a.id) DESC
	`)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var cs CategoryStat
			rows.Scan(&cs.Name, &cs.Count)
			stats.ByCategory = append(stats.ByCategory, cs)
		}
	}
	if stats.ByCategory == nil {
		stats.ByCategory = []CategoryStat{}
	}

	// By Location
	rows, err = repository.DB.Query(`
		SELECT l.name, COUNT(a.id) 
		FROM locations l 
		LEFT JOIN assets a ON l.id = a.location_id 
		GROUP BY l.id, l.name 
		ORDER BY COUNT(a.id) DESC
	`)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var ls LocationStat
			rows.Scan(&ls.Name, &ls.Count)
			stats.ByLocation = append(stats.ByLocation, ls)
		}
	}
	if stats.ByLocation == nil {
		stats.ByLocation = []LocationStat{}
	}

	// By Budget Source
	rows, err = repository.DB.Query(`
		SELECT b.name, COUNT(a.id), COALESCE(SUM(a.price), 0)
		FROM budget_sources b 
		LEFT JOIN assets a ON b.id = a.budget_source_id 
		GROUP BY b.id, b.name 
		ORDER BY SUM(a.price) DESC
	`)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var bs BudgetStat
			rows.Scan(&bs.Name, &bs.Count, &bs.Value)
			stats.ByBudgetSource = append(stats.ByBudgetSource, bs)
		}
	}
	if stats.ByBudgetSource == nil {
		stats.ByBudgetSource = []BudgetStat{}
	}

	return c.JSON(http.StatusOK, stats)
}
