import { useEffect, useState } from "react";
import { AlertTriangle, ShieldAlert, Calendar, Wrench, CheckCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { notificationApi, type NotificationSummary, type WarrantyAlert, type BrokenAssetAlert } from "@/lib/api";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

const conditionColors: Record<string, string> = {
  OK: "bg-green-500",
  RUSAK_RINGAN: "bg-yellow-500",
  RUSAK_TOTAL: "bg-red-500",
  MAINTENANCE: "bg-blue-500",
};

const conditionLabels: Record<string, string> = {
  OK: "Baik",
  RUSAK_RINGAN: "Rusak Ringan",
  RUSAK_TOTAL: "Rusak Total",
  MAINTENANCE: "Maintenance",
};

export function Notifications() {
  const [summary, setSummary] = useState<NotificationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [warrantyDays, setWarrantyDays] = useState(30);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationApi.getSummary(warrantyDays);
      setSummary(res.data);
    } catch {
      toast.error("Gagal memuat notifikasi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [warrantyDays]);

  const totalAlerts = (summary?.warranty_expiring?.length || 0) + (summary?.broken_assets?.length || 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifikasi</h1>
          <p className="text-muted-foreground">
            Peringatan dan notifikasi sistem
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchNotifications} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {totalAlerts > 0 && (
            <Badge variant="destructive" className="text-sm px-3 py-1">
              {totalAlerts} notifikasi
            </Badge>
          )}
        </div>
      </div>

      {loading && !summary ? (
        <div className="text-center py-12 text-muted-foreground">Memuat...</div>
      ) : !summary ? (
        <div className="text-center py-12 text-muted-foreground">
          Gagal memuat notifikasi
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Kondisi Aset</CardTitle>
                <ShieldAlert className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">{summary.total_ok}</p>
                      <p className="text-xs text-muted-foreground">Baik</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-2xl font-bold">{summary.total_broken}</p>
                      <p className="text-xs text-muted-foreground">Rusak</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Warranty Akan Berakhir</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{summary.warranty_expiring.length}</p>
                    <p className="text-xs text-muted-foreground">
                      dalam {warrantyDays} hari
                    </p>
                  </div>
                  <Select
                    value={warrantyDays.toString()}
                    onValueChange={(val) => setWarrantyDays(Number(val))}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 hari</SelectItem>
                      <SelectItem value="14">14 hari</SelectItem>
                      <SelectItem value="30">30 hari</SelectItem>
                      <SelectItem value="60">60 hari</SelectItem>
                      <SelectItem value="90">90 hari</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="warranty" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="warranty" className="flex-1">
                <Calendar className="h-4 w-4 mr-2" />
                Warranty
                {summary.warranty_expiring.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {summary.warranty_expiring.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="broken" className="flex-1">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Aset Rusak
                {summary.broken_assets.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {summary.broken_assets.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="warranty" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Warranty Akan Berakhir</CardTitle>
                </CardHeader>
                <CardContent>
                  {summary.warranty_expiring.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
                      <p>Tidak ada warranty yang akan berakhir</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {summary.warranty_expiring.map((item: WarrantyAlert) => (
                        <WarrantyAlertItem key={item.asset.id} item={item} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="broken" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Aset Rusak</CardTitle>
                </CardHeader>
                <CardContent>
                  {summary.broken_assets.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
                      <p>Semua aset dalam kondisi baik</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {summary.broken_assets.map((item: BrokenAssetAlert) => (
                        <BrokenAssetItem key={item.asset.id} item={item} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

function WarrantyAlertItem({ item }: { item: WarrantyAlert }) {
  const isExpired = item.days_remaining <= 0;
  const isUrgent = item.days_remaining <= 7 && item.days_remaining > 0;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-lg ${isExpired ? "bg-red-500/10" : isUrgent ? "bg-yellow-500/10" : "bg-blue-500/10"}`}>
          <Calendar className={`h-4 w-4 ${isExpired ? "text-red-500" : isUrgent ? "text-yellow-500" : "text-blue-500"}`} />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{item.asset.name}</span>
            <span className="text-sm text-muted-foreground font-mono">{item.asset.code}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Warranty: {item.asset.warranty_expiry ? new Date(item.asset.warranty_expiry).toLocaleDateString("id-ID") : "N/A"}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isExpired ? (
          <Badge variant="destructive">Expired</Badge>
        ) : (
          <Badge variant={isUrgent ? "destructive" : "secondary"}>
            {item.days_remaining} hari
          </Badge>
        )}
        <Button variant="outline" size="sm" asChild>
          <Link to="/assets/$id" params={{ id: String(item.asset.id) }}>
            Lihat
          </Link>
        </Button>
      </div>
    </div>
  );
}

function BrokenAssetItem({ item }: { item: BrokenAssetAlert }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-lg bg-red-500/10">
          <Wrench className="h-4 w-4 text-red-500" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{item.asset.name}</span>
            <span className="text-sm text-muted-foreground font-mono">{item.asset.code}</span>
            <Badge className={`${conditionColors[item.asset.condition] || "bg-gray-500"} text-white`}>
              {conditionLabels[item.asset.condition] || item.asset.condition}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            {item.maintenance_count}x maintenance
            {item.last_maintenance && ` • Terakhir: ${new Date(item.last_maintenance).toLocaleDateString("id-ID")}`}
          </div>
        </div>
      </div>
      <Button variant="outline" size="sm" asChild>
        <Link to="/assets/$id" params={{ id: String(item.asset.id) }}>
          Lihat Detail
        </Link>
      </Button>
    </div>
  );
}
