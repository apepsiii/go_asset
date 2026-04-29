import { useState, useEffect } from "react";
import { Printer, Check, X, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { maintenanceLogApi, type MaintenanceLogWithAsset } from "@/lib/api";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";

export function MaintenanceLabelPrint() {
  const [logs, setLogs] = useState<MaintenanceLogWithAsset[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await maintenanceLogApi.getAll();
      setLogs(res.data);
    } catch {
      toast.error("Failed to fetch maintenance logs");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === logs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(logs.map((l) => l.id)));
    }
  };

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handlePrint = () => {
    if (selectedIds.size === 0) {
      toast.error("Pilih label yang akan dicetak");
      return;
    }
    const url = maintenanceLogApi.getBulkLabelUrl(Array.from(selectedIds));
    window.open(url, "_blank");
  };

  if (loading) {
    return (
      <>
        <Header title="Cetak Label Maintenance" />
        <Main>
          <div className="p-6">Loading...</div>
        </Main>
      </>
    );
  }

  return (
    <>
      <Header title="Cetak Label Maintenance" />
      <Main>
        <div className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Printer className="h-6 w-6" />
                Cetak Label Maintenance
              </h1>
              <p className="text-muted-foreground">
                Pilih maintenance log untuk cetak label Tom & Jerry 103 ({selectedIds.size} dipilih)
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedIds(new Set())}
                disabled={selectedIds.size === 0}
              >
                <X className="h-4 w-4 mr-2" />
                Batal
              </Button>
              <Button onClick={handlePrint} disabled={selectedIds.size === 0}>
                <Printer className="h-4 w-4 mr-2" />
                Cetak {selectedIds.size} Label
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Daftar Maintenance</span>
                <Button variant="ghost" size="sm" onClick={toggleSelectAll}>
                  {selectedIds.size === logs.length ? "Batal Pilih Semua" : "Pilih Semua"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    onClick={() => toggleSelect(log.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedIds.has(log.id)
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          selectedIds.has(log.id)
                            ? "border-primary bg-primary"
                            : "border-muted-foreground"
                        }`}
                      >
                        {selectedIds.has(log.id) && <Check className="h-4 w-4 text-white" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="font-mono text-sm font-bold text-blue-600">{log.asset_code}</span>
                        </div>
                        <p className="text-sm truncate font-medium">{log.asset_name}</p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(log.action_date).toLocaleDateString("id-ID")}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {log.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Teknisi: {log.technician_name || "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {logs.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Tidak ada data maintenance
                </p>
              )}
            </CardContent>
          </Card>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">Info Kertas Tom & Jerry 103 (Landscape)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-blue-700">
              <div>
                <span className="font-medium">Ukuran Label:</span> 64mm x 32mm
              </div>
              <div>
                <span className="font-medium">Kolom:</span> 4 per baris
              </div>
              <div>
                <span className="font-medium">Baris:</span> 6 per halaman
              </div>
              <div>
                <span className="font-medium">Total:</span> 24 label per halaman
              </div>
            </div>
          </div>
        </div>
      </Main>
    </>
  );
}