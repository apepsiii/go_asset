import { useState, useRef } from "react";
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { exportApi, importApi, type ImportResult } from "@/lib/api";
import { toast } from "sonner";

export function ImportExport() {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    window.location.href = exportApi.getCsvUrl();
    toast.success("Export dimulai. File akan terunduh shortly.");
  };

  const handleImport = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Hanya file CSV yang didukung");
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const res = await importApi.importCsv(file);
      setImportResult(res.data);
      if (res.data.failed === 0) {
        toast.success(`Berhasil import ${res.data.success} aset`);
      } else {
        toast.warning(`Import selesai: ${res.data.success} berhasil, ${res.data.failed} gagal`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Gagal import file");
    } finally {
      setImporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImport(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImport(file);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import / Export</h1>
        <p className="text-muted-foreground">
          Import dan export data aset dari/ke file CSV
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Data Aset
            </CardTitle>
            <CardDescription>
              Download semua data aset dalam format CSV untuk backup atau analisis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-6 border-2 border-dashed rounded-lg text-center">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground mb-4">
                File CSV akan berisi semua data aset termasuk kategori, lokasi, dan spesifikasi
              </p>
              <Button onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Data Aset
            </CardTitle>
            <CardDescription>
              Upload file CSV untuk import data aset secara bulk
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`p-6 border-2 border-dashed rounded-lg text-center transition-colors ${
                dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <Upload className={`h-12 w-12 mx-auto mb-4 ${dragOver ? "text-primary" : "text-muted-foreground opacity-50"}`} />
              <p className="text-sm mb-2">
                Drag & drop file CSV di sini
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                atau
              </p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
              >
                {importing ? "Memproses..." : "Pilih File"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            

            {importResult && (
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Hasil Import</span>
                  <Badge variant={importResult.failed === 0 ? "default" : "secondary"}>
                    {importResult.failed === 0 ? "Berhasil" : "Sebagian"}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1">
                      <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                      <p className="text-2xl font-bold">{importResult.total}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <p className="text-2xl font-bold text-green-500">{importResult.success}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Berhasil</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <p className="text-2xl font-bold text-red-500">{importResult.failed}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Gagal</p>
                  </div>
                </div>
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm font-medium mb-2 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      Error Details:
                    </p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {importResult.errors.map((err, i) => (
                        <p key={i} className="text-xs text-red-500 font-mono">{err}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Format CSV</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            File CSV harus memiliki kolom berikut:
          </p>
          <div className="bg-muted p-4 rounded-lg font-mono text-xs overflow-x-auto">
            <code>
              code, name, specification, condition, category_id, budget_source_id, location_id, purchase_date, price, warranty_expiry
            </code>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
           * Category ID, Budget Source ID, dan Location ID harus sesuai dengan data yang sudah ada di sistem.
            Condition: OK, RUSAK_RINGAN, RUSAK_TOTAL, MAINTENANCE
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
