import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Archive, CheckCircle, AlertTriangle, XCircle, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { statsApi, type DashboardStats } from "@/lib/api";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = ["#22c55e", "#eab308", "#ef4444", "#3b82f6"];

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await statsApi.getDashboard();
        setStats(res.data);
      } catch {
        toast.error("Failed to fetch dashboard stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <p>No data available</p>
      </div>
    );
  }

  const conditionData = [
    { name: "OK", value: stats.ok_count, color: COLORS[0] },
    { name: "Rusak Ringan", value: stats.rusak_ringan_count, color: COLORS[1] },
    { name: "Rusak Total", value: stats.rusak_total_count, color: COLORS[2] },
    { name: "Maintenance", value: stats.maintenance_count, color: COLORS[3] },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Lab Asset Management System Overview
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_assets}</div>
            <p className="text-xs text-muted-foreground">units</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">OK</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.ok_count}</div>
            <p className="text-xs text-muted-foreground">units in good condition</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {stats.rusak_ringan_count + stats.maintenance_count}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.rusak_ringan_count} damaged, {stats.maintenance_count} in maintenance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.rusak_total_count}</div>
            <p className="text-xs text-muted-foreground">units need replacement</p>
          </CardContent>
        </Card>
      </div>

      {/* Total Value Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Asset Value</CardTitle>
          <Wrench className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            Rp {stats.total_value.toLocaleString("id-ID")}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Condition Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Asset Condition Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={conditionData.filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                  >
                    {conditionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* By Category */}
        <Card>
          <CardHeader>
            <CardTitle>Assets by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.by_category}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* By Location */}
        <Card>
          <CardHeader>
            <CardTitle>Assets by Location</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.by_location}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#22c55e" name="Assets" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* By Budget Source */}
        <Card>
          <CardHeader>
            <CardTitle>Assets by Budget Source</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.by_budget_source}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" type="number" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="count" fill="#8b5cf6" name="Assets" />
                  <Bar
                    yAxisId="right"
                    dataKey="total_value"
                    fill="#f97316"
                    name="Value (Rp)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
