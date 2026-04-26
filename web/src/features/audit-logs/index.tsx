import { useEffect, useState } from "react";
import { Shield, User, FileText, Upload, Trash2, LogIn } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { auditLogApi, type AuditLog } from "@/lib/api";
import { toast } from "sonner";

const actionIcons: Record<string, typeof Shield> = {
  CREATE: FileText,
  READ: FileText,
  UPDATE: FileText,
  DELETE: Trash2,
  UPLOAD: Upload,
  LOGIN: LogIn,
};

const actionColors: Record<string, string> = {
  CREATE: "bg-green-500",
  READ: "bg-blue-500",
  UPDATE: "bg-yellow-500",
  DELETE: "bg-red-500",
  UPLOAD: "bg-purple-500",
  LOGIN: "bg-gray-500",
};

const resourceOptions = [
  { value: "", label: "Semua" },
  { value: "asset", label: "Asset" },
  { value: "loan", label: "Loan" },
  { value: "import", label: "Import" },
  { value: "export", label: "Export" },
  { value: "maintenance_log", label: "Maintenance" },
  { value: "upgrade_log", label: "Upgrade" },
  { value: "loan_return", label: "Return" },
];

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [resource, setResource] = useState("");
  const [search, setSearch] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await auditLogApi.getAll(resource || undefined);
      setLogs(res.data);
    } catch {
      toast.error("Gagal memuat audit log");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [resource]);

  const filteredLogs = logs.filter((log) =>
    !search ||
    log.user_id.toLowerCase().includes(search.toLowerCase()) ||
    log.resource.toLowerCase().includes(search.toLowerCase()) ||
    log.details?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDetails = (details: string | null) => {
    if (!details) return "-";
    try {
      const parsed = JSON.parse(details);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return details;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground">
          Riwayat aktivitas pengguna dalam sistem
        </p>
      </div>

      <div className="flex gap-4 items-center">
        <Input
          placeholder="Cari log..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={resource} onValueChange={setResource}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter resource" />
          </SelectTrigger>
          <SelectContent>
            {resourceOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="outline" className="ml-auto">
          {filteredLogs.length} records
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Riwayat Aktivitas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Memuat...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Tidak ada data audit log
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => {
                const Icon = actionIcons[log.action] || FileText;
                const colorClass = actionColors[log.action] || "bg-gray-500";
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${colorClass}/10`}>
                      <Icon className={`h-4 w-4 ${colorClass}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={colorClass} variant="secondary">
                          {log.action}
                        </Badge>
                        <span className="font-medium">{log.resource}</span>
                        {log.resource_id && (
                          <span className="text-sm text-muted-foreground font-mono">
                            #{log.resource_id}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {log.user_id || "anonymous"}
                        </span>
                        <span className="mx-2">•</span>
                        <span>{formatDate(log.created_at)}</span>
                        {log.ip_address && (
                          <>
                            <span className="mx-2">•</span>
                            <span className="font-mono text-xs">{log.ip_address}</span>
                          </>
                        )}
                      </div>
                      {log.details && (
                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto max-w-2xl">
                          {formatDetails(log.details)}
                        </pre>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
