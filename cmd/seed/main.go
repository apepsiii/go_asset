package main

import (
	"database/sql"
	"fmt"
	"log"
	"math/rand"
	"time"

	_ "modernc.org/sqlite"
)

var categories = []string{
	"Laptop", "PC Desktop", "Router", "Proyektor", "Meubler",
}

var locations = []string{
	"Lab Komputer 1", "Lab Komputer 2", "Lab Jaringan", "Ruang Server", "Ruang Kelas 1",
	"Ruang Kelas 2", "Ruang Kelas 3", "Perpustakaan", "Ruang Kerja", "Ruang Meeting",
}

var budgetSources = []string{
	"BOS", "Hibah Pemerintah", "DAK", "APBD", "Hibah Perusahaan",
}

var conditions = []string{
	"OK", "OK", "OK", "OK", "OK", "OK", "OK", "OK", "RUSAK_RINGAN", "MAINTENANCE",
}

var brands = map[string][]string{
	"Laptop":     {"Acer", "Asus", "Lenovo", "Dell", "HP"},
	"PC Desktop": {"Acer", "Asus", "Lenovo", "Dell", "HP"},
	"Router":     {"TP-Link", "D-Link", "MikroTik", "Cisco", "Netgear"},
	"Proyektor":  {"Epson", "BenQ", "Sony", "NEC", "Optoma"},
	"Meubler":    {"IKEA", "Olympic", "Brother", "3M", "Samsung"},
}

var specs = map[string]struct {
	cpu  string
	ram  string
	stor string
}{
	"Laptop":     {"Intel Core i5-1235U", "16GB DDR5", "512GB SSD"},
	"PC Desktop": {"Intel Core i5-12400F", "16GB DDR4", "512GB NVMe SSD"},
	"Router":     {"-", "-", "-"},
	"Proyektor":  {"-", "-", "-"},
	"Meubler":    {"-", "-", "-"},
}

func main() {
	db, err := sql.Open("sqlite", "./data/lab_asset.db")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatal(err)
	}

	rand.Seed(time.Now().UnixNano())

	fmt.Println("Generating 200 dummy assets...")

	dateStr := "260426"

	for i := 1; i <= 200; i++ {
		catIdx := rand.Intn(len(categories))
		locIdx := rand.Intn(len(locations))
		budgetIdx := rand.Intn(len(budgetSources))
		condIdx := rand.Intn(len(conditions))

		categoryName := categories[catIdx]
		prefix := getPrefix(categoryName)
		seq := 1000 + i

		brand := brands[categoryName][rand.Intn(len(brands[categoryName]))]
		code := fmt.Sprintf("%s%s%05d", prefix, dateStr, seq)
		name := fmt.Sprintf("%s %s", brand, categoryName)

		specMap := specs[categoryName]
		specsJSON := "{}"
		if categoryName == "Laptop" || categoryName == "PC Desktop" {
			specsJSON = fmt.Sprintf(`{"brand":"%s","cpu":"%s","ram":"%s","storage":"%s","macAddress":"00:%02X:%02X:%02X:%02X:%02X"}`,
				brand, specMap.cpu, specMap.ram, specMap.stor,
				rand.Intn(256), rand.Intn(256), rand.Intn(256), rand.Intn(256), rand.Intn(256))
		}

		price := float64(rand.Intn(20000000) + 1000000)
		purchaseDate := fmt.Sprintf("2024-%02d-%02d", rand.Intn(12)+1, rand.Intn(28)+1)
		warrantyExpiry := fmt.Sprintf("2027-%02d-%02d", rand.Intn(12)+1, rand.Intn(28)+1)

		_, err := db.Exec(`
			INSERT INTO assets (category_id, budget_source_id, location_id, code, name, specification, specifications,
			                   condition, purchase_date, price, warranty_expiry, useful_life_years, salvage_value, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`, catIdx+1, budgetIdx+1, locIdx+1, code, name, categoryName+" general specification",
			specsJSON, conditions[condIdx], purchaseDate, price, warrantyExpiry, 5, 0,
			time.Now().Format("2006-01-02T15:04:05Z"), time.Now().Format("2006-01-02T15:04:05Z"))

		if err != nil {
			log.Printf("Error inserting asset %d: %v", i, err)
		}
	}

	fmt.Println("Successfully generated 200 dummy assets!")
}

func getPrefix(categoryName string) string {
	result := ""
	for _, r := range categoryName {
		if (r >= 'A' && r <= 'Z') || (r >= 'a' && r <= 'z') {
			result += string(r &^ ' ')
		}
		if len(result) == 3 {
			break
		}
	}
	for len(result) < 3 {
		result += "X"
	}
	return result
}
