import { useState, useEffect } from "react";
import { FileText, Download, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categoryApi, locationApi, type Category, type Location } from "@/lib/api";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

const reportTypes = [
  { value: "summary", label: "Laporan Ringkasan", description: "Overview semua aset dengan statistik" },
  { value: "full", label: "Laporan Lengkap", description: "Daftar semua aset dalam format tabel" },
  { value: "by_location", label: "Per Lokasi", description: "Aset berdasarkan lokasi实验室" },
  { value: "by_category", label: "Per Kategori", description: "Aset berdasarkan kategori" },
  { value: "by_condition", label: "Per Kondisi", description: "Aset berdasarkan kondisi" },
  { value: "maintenance", label: "Riwayat Maintenance", description: "Riwayat maintenance aset" },
];

const conditions = [
  { value: "OK", label: "Baik (OK)" },
  { value: "RUSAK_RINGAN", label: "Rusak Ringan" },
  { value: "RUSAK_TOTAL", label: "Rusak Total" },
  { value: "MAINTENANCE", label: "Maintenance" },
];

export function Reports() {
  const [reportType, setReportType] = useState("summary");
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedCondition, setSelectedCondition] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, locRes] = await Promise.all([
          categoryApi.getAll(),
          locationApi.getAll(),
        ]);
        setCategories(catRes.data);
        setLocations(locRes.data);
      } catch {
        // ignore
      }
    };
    fetchData();
  }, []);

  const handleGenerate = () => {
    setLoading(true);
    let url = `${API_BASE}/api/reports?type=${reportType}`;

    if (reportType === "by_category" && selectedCategory) {
      url += `&category_id=${selectedCategory}`;
    }
    if (reportType === "by_location" && selectedLocation) {
      url += `&location_id=${selectedLocation}`;
    }
    if (reportType === "by_condition" && selectedCondition) {
      url += `&condition=${selectedCondition}`;
    }

    window.location.href = url;
    toast.success("Laporan sedang diunduh...");

    setTimeout(() => setLoading(false), 2000);
  };

  const needsCategory = reportType === "by_category";
  const needsLocation = reportType === "by_location";
  const needsCondition = reportType === "by_condition";

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Laporan</h1>
        <p className="text-muted-foreground">
          Generate laporan aset dalam format PDF
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Pilih Jenis Laporan
            </CardTitle>
            <CardDescription>
              Pilih jenis laporan yang ingin di-generate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {reportTypes.map((type) => (
                <div
                  key={type.value}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    reportType === type.value
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setReportType(type.value)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{type.label}</p>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        reportType === type.value
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Laporan
            </CardTitle>
            <CardDescription>
              Konfigurasi filter sesuai jenis laporan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {needsCategory && (
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua Kategori</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {needsLocation && (
              <div className="space-y-2">
                <Label>Lokasi</Label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih lokasi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua Lokasi</SelectItem>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={String(loc.id)}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {needsCondition && (
              <div className="space-y-2">
                <Label>Kondisi</Label>
                <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kondisi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua Kondisi</SelectItem>
                    {conditions.map((cond) => (
                      <SelectItem key={cond.value} value={cond.value}>
                        {cond.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {!needsCategory && !needsLocation && !needsCondition && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Tidak ada filter tambahan untuk laporan ini</p>
              </div>
            )}

            <Button className="w-full" onClick={handleGenerate} disabled={loading}>
              <Download className="h-4 w-4 mr-2" />
              {loading ? "Mengunduh..." : "Generate & Download PDF"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
