import { useEffect, useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Plus, Trash2, Printer, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import {
  assetApi,
  categoryApi,
  locationApi,
  budgetSourceApi,
  maintenanceLogApi,
  upgradeLogApi,
  qrCodeApi,
  labelApi,
  loanApi,
  type Asset,
  type MaintenanceLog,
  type UpgradeLog,
  type LoanWithAsset,
  type DepreciationInfo,
} from "@/lib/api";

const conditionLabels: Record<string, { label: string; color: string }> = {
  OK: { label: "OK", color: "bg-green-500" },
  RUSAK_RINGAN: { label: "Rusak Ringan", color: "bg-yellow-500" },
  RUSAK_TOTAL: { label: "Rusak Total", color: "bg-red-500" },
  MAINTENANCE: { label: "Maintenance", color: "bg-blue-500" },
};

const depreciationStatusLabels: Record<string, { label: string; color: string }> = {
  healthy: { label: " Sehat", color: "bg-green-500" },
  depreciated: { label: "Menurun", color: "bg-yellow-500" },
  fully_depreciated: { label: "Fully Depreciated", color: "bg-red-500" },
};

export function AssetDetail() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [locations, setLocations] = useState<{ id: number; name: string }[]>([]);
  const [budgetSources, setBudgetSources] = useState<{ id: number; name: string }[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [upgradeLogs, setUpgradeLogs] = useState<UpgradeLog[]>([]);
  const [loanHistory, setLoanHistory] = useState<LoanWithAsset[]>([]);
  const [depreciation, setDepreciation] = useState<DepreciationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showMaintDialog, setShowMaintDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  const [maintForm, setMaintForm] = useState({
    action_date: "",
    description: "",
    technician_name: "",
    cost: 0,
  });

  const [upgradeForm, setUpgradeForm] = useState({
    upgrade_date: "",
    description: "",
  });

  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [showQRLoading, setShowQRLoading] = useState(false);

useEffect(() => {
    const fetchData = async () => {
      try {
        const assetId = parseInt(id, 10);
        if (isNaN(assetId)) {
          toast.error("Invalid asset ID");
          navigate({ to: "/assets" });
          return;
        }
        const [assetRes, categoriesRes, locationsRes, budgetRes, maintRes, upgradeRes, loanRes, deprRes] =
          await Promise.all([
            assetApi.getById(assetId),
            categoryApi.getAll(),
            locationApi.getAll(),
            budgetSourceApi.getAll(),
            maintenanceLogApi.getByAssetId(assetId).catch(() => ({ data: [] })),
            upgradeLogApi.getByAssetId(assetId).catch(() => ({ data: [] })),
            loanApi.getByAssetId(assetId).catch(() => ({ data: [] })),
            assetApi.getDepreciation(assetId).catch(() => ({ data: null })),
          ]);
        setAsset(assetRes.data);
        setCategories(categoriesRes.data);
        setLocations(locationsRes.data);
        setBudgetSources(budgetRes.data);
        setMaintenanceLogs(maintRes.data);
        setUpgradeLogs(upgradeRes.data);
        setLoanHistory(loanRes.data);
        if (deprRes.data) {
          setDepreciation(deprRes.data);
        }
      } catch (err: any) {
        console.error("Fetch asset error:", err);
        toast.error(err?.response?.data?.error || "Failed to fetch asset");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (deleteId === null || !asset) return;
    try {
      await assetApi.delete(asset.id);
      toast.success("Asset deleted");
      navigate({ to: "/assets" });
    } catch {
      toast.error("Failed to delete asset");
    }
    setDeleteId(null);
  };

  const toISOString = (dateStr: string): string | null => {
    if (!dateStr) return null;
    if (dateStr.includes('T')) return dateStr;
    return `${dateStr}T00:00:00Z`;
  };

  const handleAddMaintenance = async () => {
    if (!asset) return;
    try {
      const res = await maintenanceLogApi.create(asset.id, {
        description: maintForm.description,
        technician_name: maintForm.technician_name,
        cost: maintForm.cost,
        action_date: toISOString(maintForm.action_date) || new Date().toISOString(),
      });
      setMaintenanceLogs([res.data, ...maintenanceLogs]);
      setShowMaintDialog(false);
      setMaintForm({ action_date: "", description: "", technician_name: "", cost: 0 });
      toast.success("Maintenance log added");
    } catch {
      toast.error("Failed to add maintenance log");
    }
  };

  const handleAddUpgrade = async () => {
    if (!asset) return;
    try {
      const res = await upgradeLogApi.create(asset.id, {
        description: upgradeForm.description,
        upgrade_date: toISOString(upgradeForm.upgrade_date) || new Date().toISOString(),
      });
      setUpgradeLogs([res.data, ...upgradeLogs]);
      setShowUpgradeDialog(false);
      setUpgradeForm({ upgrade_date: "", description: "" });
      toast.success("Upgrade log added");
    } catch {
      toast.error("Failed to add upgrade log");
    }
  };

  const handleDeleteMaintLog = async (logId: number) => {
    try {
      await maintenanceLogApi.delete(logId);
      setMaintenanceLogs(maintenanceLogs.filter((l) => l.id !== logId));
      toast.success("Maintenance log deleted");
    } catch {
      toast.error("Failed to delete maintenance log");
    }
  };

  const handleDeleteUpgradeLog = async (logId: number) => {
    try {
      await upgradeLogApi.delete(logId);
      setUpgradeLogs(upgradeLogs.filter((l) => l.id !== logId));
      toast.success("Upgrade log deleted");
    } catch {
      toast.error("Failed to delete upgrade log");
    }
  };

  const getCategoryName = (catId: number | null) => {
    if (!catId) return "-";
    return categories.find((c) => c.id === catId)?.name || "-";
  };

  const getLocationName = (locId: number | null) => {
    if (!locId) return "-";
    return locations.find((l) => l.id === locId)?.name || "-";
  };

  const getBudgetSourceName = (budgetId: number | null) => {
    if (!budgetId) return "-";
    return budgetSources.find((b) => b.id === budgetId)?.name || "-";
  };

  const handleShowQR = async () => {
    if (!asset) return;
    setShowQRLoading(true);
    try {
      const res = await qrCodeApi.getByAssetId(asset.id);
      setQrCode(res.data.qr_code);
      setShowQRDialog(true);
    } catch {
      toast.error("Failed to generate QR code");
    } finally {
      setShowQRLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!asset) return;
    const url = labelApi.getPdfUrl(asset.id);
    window.open(url, "_blank");
  };

  const handlePrintLabel = () => {
    if (!asset) return;
    const url = labelApi.getPdfUrl(asset.id);
    const printWindow = window.open(url, "_blank");
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (!asset) {
    return <div className="p-4">Asset not found</div>;
  }

  return (
    <>
      <Header fixed>
        <Button variant='ghost' size='icon' onClick={() => navigate({ to: '/assets' })}>
          <ArrowLeft className='h-4 w-4' />
        </Button>
        <div className='flex-1 ms-2'>
          <h1 className='text-lg font-semibold'>{asset.name}</h1>
          <p className='text-sm text-muted-foreground font-mono'>{asset.code}</p>
        </div>
        <Button variant='outline' size='sm' onClick={handleShowQR} disabled={showQRLoading}>
          <QrCode className='h-4 w-4 mr-2' />
          QR Code
        </Button>
        <Button variant='default' size='sm' onClick={handlePrintLabel}>
          <Printer className='h-4 w-4 mr-2' />
          Cetak Label
        </Button>
        <Button variant='destructive' size='sm' onClick={() => setDeleteId(asset.id)}>
          <Trash2 className='h-4 w-4 mr-2' />
          Delete
        </Button>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6 overflow-y-auto'>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Asset Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category</span>
              <span>{getCategoryName(asset.category_id)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Location</span>
              <span>{getLocationName(asset.location_id)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Budget Source</span>
              <span>{getBudgetSourceName(asset.budget_source_id)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Condition</span>
              <Badge className={conditionLabels[asset.condition]?.color + " text-white"}>
                {conditionLabels[asset.condition]?.label}
              </Badge>
            </div>
            {asset.price && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price</span>
                <span>Rp {asset.price.toLocaleString("id-ID")}</span>
              </div>
            )}
            {asset.purchase_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Purchase Date</span>
                <span>{new Date(asset.purchase_date).toLocaleDateString("id-ID")}</span>
              </div>
            )}
            {asset.warranty_expiry && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Warranty Expiry</span>
                <span>{new Date(asset.warranty_expiry).toLocaleDateString("id-ID")}</span>
              </div>
            )}
            {depreciation && asset.price && (
              <>
                <div className="pt-2 border-t mt-2">
                  <p className="text-sm font-medium mb-2">Depreciation Info</p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Value</span>
                    <span className="font-semibold">
                      Rp {depreciation.current_value.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Age</span>
                    <span>{depreciation.age_in_years.toFixed(1)} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Remaining Life</span>
                    <span>{depreciation.remaining_life_years.toFixed(1)} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Annual Depreciation</span>
                    <span>Rp {depreciation.annual_depreciation.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status</span>
                    <Badge className={depreciationStatusLabels[depreciation.status]?.color + " text-white"}>
                      {depreciationStatusLabels[depreciation.status]?.label}
                    </Badge>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {asset.photo_url && (
          <Card>
            <CardHeader>
              <CardTitle>Photo</CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={import.meta.env.VITE_API_URL + asset.photo_url}
                alt={asset.name}
                className="max-w-full h-auto rounded-md"
              />
            </CardContent>
          </Card>
        )}

        {asset.specification && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Specification</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm">{asset.specification}</pre>
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs defaultValue="maintenance" className="mt-6">
        <TabsList>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="upgrade">Upgrade</TabsTrigger>
          <TabsTrigger value="loans">Peminjaman ({loanHistory.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="maintenance" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowMaintDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Maintenance
            </Button>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maintenanceLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No maintenance records
                    </TableCell>
                  </TableRow>
                ) : (
                  maintenanceLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{new Date(log.action_date).toLocaleDateString("id-ID")}</TableCell>
                      <TableCell>{log.description}</TableCell>
                      <TableCell>{log.technician_name || "-"}</TableCell>
                      <TableCell>{log.cost > 0 ? `Rp ${log.cost.toLocaleString("id-ID")}` : "-"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteMaintLog(log.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="upgrade" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowUpgradeDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Upgrade
            </Button>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upgradeLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      No upgrade records
                    </TableCell>
                  </TableRow>
                ) : (
                  upgradeLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{new Date(log.upgrade_date).toLocaleDateString("id-ID")}</TableCell>
                      <TableCell>{log.description}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteUpgradeLog(log.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="loans" className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Peminjam</TableHead>
                  <TableHead>Tanggal Pinjam</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead>Tanggal Kembali</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Kondisi Pinjam</TableHead>
                  <TableHead>Kondisi Kembali</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loanHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No loan history
                    </TableCell>
                  </TableRow>
                ) : (
                  loanHistory.map((loan) => (
                    <TableRow key={loan.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{loan.borrower_name}</p>
                          {loan.borrower_contact && (
                            <p className="text-xs text-muted-foreground">{loan.borrower_contact}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(loan.loan_date).toLocaleDateString("id-ID")}</TableCell>
                      <TableCell>{new Date(loan.due_date).toLocaleDateString("id-ID")}</TableCell>
                      <TableCell>
                        {loan.return_date ? new Date(loan.return_date).toLocaleDateString("id-ID") : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          loan.status === "RETURNED" ? "bg-green-500" :
                          loan.status === "OVERDUE" ? "bg-red-500" :
                          "bg-blue-500"
                        }>
                          {loan.status === "BORROWED" ? "Dipinjam" :
                           loan.status === "OVERDUE" ? "Terlambat" : "Dikembalikan"}
                        </Badge>
                      </TableCell>
                      <TableCell>{loan.condition_at_loan}</TableCell>
                      <TableCell>{loan.condition_at_return || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
      </Main>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this asset? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showMaintDialog} onOpenChange={setShowMaintDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Maintenance Log</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={maintForm.action_date}
                onChange={(e) => setMaintForm({ ...maintForm, action_date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Input
                value={maintForm.description}
                onChange={(e) => setMaintForm({ ...maintForm, description: e.target.value })}
                placeholder="e.g., Cleaning, Thermal paste replacement"
              />
            </div>
            <div className="grid gap-2">
              <Label>Technician Name</Label>
              <Input
                value={maintForm.technician_name}
                onChange={(e) => setMaintForm({ ...maintForm, technician_name: e.target.value })}
                placeholder="e.g., John Doe"
              />
            </div>
            <div className="grid gap-2">
              <Label>Cost (Rp)</Label>
              <Input
                type="number"
                value={maintForm.cost}
                onChange={(e) => setMaintForm({ ...maintForm, cost: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMaintDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMaintenance}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Upgrade Log</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={upgradeForm.upgrade_date}
                onChange={(e) => setUpgradeForm({ ...upgradeForm, upgrade_date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Input
                value={upgradeForm.description}
                onChange={(e) => setUpgradeForm({ ...upgradeForm, description: e.target.value })}
                placeholder="e.g., RAM 8GB -> 16GB, SSD 256GB -> 512GB"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUpgrade}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code - {asset?.code}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-4">
            {qrCode ? (
              <>
                <img src={qrCode} alt="QR Code" className="max-w-xs mx-auto rounded-lg border" />
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Scan QR code untuk melihat detail aset
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  atau buka: {window.location.origin}/public/asset/{asset?.id}
                </p>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" onClick={handleDownloadPDF}>
                    <Printer className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button onClick={handlePrintLabel}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print Langsung
                  </Button>
                </div>
              </>
            ) : (
              <p>Generating QR code...</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
