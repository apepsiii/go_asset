import { useEffect, useState } from "react";
import { Bell, AlertTriangle, ShieldAlert, Calendar, Wrench, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { notificationApi, type NotificationSummary, type WarrantyAlert, type BrokenAssetAlert } from "@/lib/api";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

const conditionColors: Record<string, string> = {
  OK: "bg-green-500",
  RUSAK_RINGAN: "bg-yellow-500",
  RUSAK_TOTAL: "bg-red-500",
  MAINTENANCE: "bg-blue-500",
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
  }, [warrantyDays]);

  const totalAlerts = (summary?.warranty_expiring?.length || 0) + (summary?.broken_assets?.length || 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifikasi</h1>
          <p className="text-muted-foreground">
            Peringatan dan notifikasi sistem
          </p>
        </div>
        {totalAlerts > 0 && (
          <Badge variant="destructive" className="text-sm px-3 py-1">
            {totalAlerts} notifikasi
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Memuat...</div>
      ) : !summary ? (
        <div className="text-center py-12 text-muted-foreground">
          Gagal memuat notifikasi
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Kondisi Aset</CardTitle>
                <ShieldAlert className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">{summary.total_ok}</p>
                      <p className="text-xs text-muted-foreground">Baik</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
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
                <p className="text-2xl font-bold">{summary.warranty_expiring.length}</p>
                <p className="text-xs text-muted-foreground">
                  dalam {warrantyDays} hari ke depan
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="warranty" className="w-full">
            <TabsList>
              <TabsTrigger value="warranty" className="relative">
                <Calendar className="h-4 w-4 mr-2" />
                Warranty
                {summary.warranty_expiring.length > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 justify-center items-center text-xs">
                    {summary.warranty_expiring.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="broken">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Aset Rusak
                {summary.broken_assets.length > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 justify-center items-center text-xs">
                    {summary.broken_assets.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="warranty" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Warranty Akan Berakhir</CardTitle>
                    <select
                      className="text-sm border rounded px-2 py-1"
                      value={warrantyDays}
                      onChange={(e) => setWarrantyDays(Number(e.target.value))}
                    >
                      <option value={7}>7 hari</option>
                      <option value={14}>14 hari</option>
                      <option value={30}>30 hari</option>
                      <option value={60}>60 hari</option>
                      <option value={90}>90 hari</option>
                    </select>
                  </div>
                </CardHeader>
                <CardContent>
                  {summary.warranty_expiring.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
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
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
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
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-lg ${isExpired ? "bg-red-500/10" : isUrgent ? "bg-yellow-500/10" : "bg-blue-500/10"}`}>
          <Calendar className={`h-4 w-4 ${isExpired ? "text-red-500" : isUrgent ? "text-yellow-500" : "text-blue-500"}`} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{item.asset.name}</span>
            <span className="text-sm text-muted-foreground font-mono">{item.asset.code}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Warranty: {item.asset.warranty_expiry ? new Date(item.asset.warranty_expiry).toLocaleDateString("id-ID") : "N/A"}
          </div>
        </div>
      </div>
      <div className="text-right">
        {isExpired ? (
          <Badge variant="destructive">Expired</Badge>
        ) : (
          <Badge variant={isUrgent ? "destructive" : "outline"}>
            {item.days_remaining} hari
          </Badge>
        )}
        <Button variant="ghost" size="sm" className="ml-2" asChild>
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
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-lg bg-red-500/10">
          <Wrench className="h-4 w-4 text-red-500" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{item.asset.name}</span>
            <span className="text-sm text-muted-foreground font-mono">{item.asset.code}</span>
            <Badge className={`${conditionColors[item.asset.condition]} text-white`}>
              {item.asset.condition}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            {item.maintenance_count} kali maintenance
            {item.last_maintenance && ` • Terakhir: ${new Date(item.last_maintenance).toLocaleDateString("id-ID")}`}
          </div>
        </div>
      </div>
      <Button variant="ghost" size="sm" asChild>
        <Link to="/assets/$id" params={{ id: String(item.asset.id) }}>
          Lihat
        </Link>
      </Button>
    </div>
  );
}
