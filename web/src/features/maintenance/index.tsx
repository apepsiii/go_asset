import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Wrench, Calendar, User, Search, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { maintenanceLogApi, type MaintenanceLogWithAsset } from "@/lib/api";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";

export function MaintenancePage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<MaintenanceLogWithAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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

  const filteredLogs = logs.filter((log) => {
    const searchLower = search.toLowerCase();
    return (
      log.asset_code.toLowerCase().includes(searchLower) ||
      log.asset_name.toLowerCase().includes(searchLower) ||
      log.description.toLowerCase().includes(searchLower) ||
      log.technician_name.toLowerCase().includes(searchLower)
    );
  });

  return (
    <>
      <Header title="Maintenance" />
      <Main>
        <div className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Wrench className="h-6 w-6" />
                Maintenance
              </h1>
              <p className="text-muted-foreground">
                Daftar riwayat maintenance aset ({filteredLogs.length} records)
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate({ to: "/maintenance-label-print" })}>
                <Wrench className="h-4 w-4 mr-2" />
                Cetak Label
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Daftar Maintenance</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari maintenance..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {search ? "Tidak ada hasil pencarian" : "Belum ada data maintenance"}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate({ to: `/assets/${log.asset_id}` })}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Wrench className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-blue-600">{log.asset_code}</span>
                            <Badge variant="outline" className="text-xs">
                              MAINT-{log.id}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium">{log.asset_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(log.action_date).toLocaleDateString("id-ID")}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <User className="h-3 w-3" />
                            {log.technician_name || "-"}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  );
}