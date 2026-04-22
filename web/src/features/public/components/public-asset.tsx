import { useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";
import type { Asset, MaintenanceLog } from "@/lib/api";

const conditionLabels: Record<string, { label: string; color: string }> = {
  OK: { label: "OK", color: "bg-green-500" },
  RUSAK_RINGAN: { label: "Rusak Ringan", color: "bg-yellow-500" },
  RUSAK_TOTAL: { label: "Rusak Total", color: "bg-red-500" },
  MAINTENANCE: { label: "Maintenance", color: "bg-blue-500" },
};

export function PublicAsset() {
  const { id } = useParams({ strict: false }) as { id: string };
  const [asset, setAsset] = useState<Asset | null>(null);
  const [lastMaintenance, setLastMaintenance] = useState<MaintenanceLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const assetId = parseInt(id, 10);
        const [assetRes, maintRes] = await Promise.all([
          api.get<Asset>(`/api/assets/${assetId}`),
          api.get<MaintenanceLog[]>(`/api/assets/${assetId}/maintenance-logs`),
        ]);
        setAsset(assetRes.data);
        if (maintRes.data.length > 0) {
          setLastMaintenance(maintRes.data[0]);
        }
      } catch {
        toast.error("Asset not found");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Asset not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto space-y-4">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{asset.name}</CardTitle>
              <Badge className={conditionLabels[asset.condition]?.color + " text-white"}>
                {conditionLabels[asset.condition]?.label}
              </Badge>
            </div>
            <p className="text-muted-foreground font-mono text-sm">{asset.code}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {asset.photo_url && (
              <img
                src={API_URL + asset.photo_url}
                alt={asset.name}
                className="w-full max-h-64 object-contain rounded-md border"
              />
            )}

            {asset.specification && (
              <div>
                <h3 className="font-semibold text-sm mb-1">Spesifikasi</h3>
                <pre className="text-xs bg-gray-100 p-2 rounded whitespace-pre-wrap">
                  {asset.specification}
                </pre>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-sm">
              {asset.purchase_date && (
                <div>
                  <span className="text-muted-foreground">Tanggal Beli:</span>
                  <p>{new Date(asset.purchase_date).toLocaleDateString("id-ID")}</p>
                </div>
              )}
              {asset.price && (
                <div>
                  <span className="text-muted-foreground">Harga:</span>
                  <p>Rp {asset.price.toLocaleString("id-ID")}</p>
                </div>
              )}
            </div>

            {lastMaintenance && (
              <div className="pt-2 border-t">
                <h3 className="font-semibold text-sm mb-1">Servis Terakhir</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(lastMaintenance.action_date).toLocaleDateString("id-ID")}
                </p>
                <p className="text-sm">{lastMaintenance.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          LabAsset Manager - SMK Asset Management System
        </p>
      </div>
    </div>
  );
}
