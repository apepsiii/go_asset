import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeftRight, Plus, Check, X, AlertTriangle } from "lucide-react";
import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  loanApi,
  type LoanWithAsset,
  type Asset,
  type LoanStats,
} from "@/lib/api";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  BORROWED: "bg-blue-500",
  RETURNED: "bg-green-500",
  OVERDUE: "bg-red-500",
};

const conditionColors: Record<string, string> = {
  OK: "bg-green-500",
  RUSAK_RINGAN: "bg-yellow-500",
  RUSAK_TOTAL: "bg-red-500",
  MAINTENANCE: "bg-blue-500",
};

const conditionOptions = [
  { value: "OK", label: "OK" },
  { value: "RUSAK_RINGAN", label: "Rusak Ringan" },
  { value: "RUSAK_TOTAL", label: "Rusak Total" },
  { value: "MAINTENANCE", label: "Maintenance" },
];

function toISOString(dateStr: string): string {
  if (!dateStr) return new Date().toISOString();
  if (dateStr.includes("T")) return dateStr;
  return `${dateStr}T00:00:00Z`;
}

export const Route = createFileRoute("/_authenticated/loans/")({
  component: LoansComponent,
});

function LoansComponent() {
  const [activeTab, setActiveTab] = useState<"new" | "return">("new");
  const [stats, setStats] = useState<LoanStats | null>(null);
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [assetSearch, setAssetSearch] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [borrowerName, setBorrowerName] = useState("");
  const [borrowerContact, setBorrowerContact] = useState("");
  const [loanDate, setLoanDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [conditionAtLoan, setConditionAtLoan] = useState("OK");
  const [loanNotes, setLoanNotes] = useState("");
  const [activeLoans, setActiveLoans] = useState<LoanWithAsset[]>([]);
  const [loanSearch, setLoanSearch] = useState("");
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnLoan, setReturnLoan] = useState<LoanWithAsset | null>(null);
  const [returnCondition, setReturnCondition] = useState("");
  const [returnNotes, setReturnNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await loanApi.getStats();
      setStats(res.data);
    } catch { toast.error("Gagal memuat statistik"); }
  };

  const fetchAvailableAssets = async () => {
    try {
      const res = await loanApi.getAvailableAssets();
      setAvailableAssets(res.data);
    } catch { toast.error("Gagal memuat aset"); }
  };

  const fetchActiveLoans = async () => {
    try {
      const res = await loanApi.getActive();
      setActiveLoans(res.data);
    } catch { toast.error("Gagal memuat peminjaman"); }
  };

  useEffect(() => {
    const load = async () => {
      setInitialLoading(true);
      await Promise.all([fetchStats(), fetchAvailableAssets(), fetchActiveLoans()]);
      setInitialLoading(false);
    };
    load();
  }, []);

  const filteredAssets = availableAssets.filter((a) =>
    !assetSearch ||
    a.name.toLowerCase().includes(assetSearch.toLowerCase()) ||
    a.code.toLowerCase().includes(assetSearch.toLowerCase())
  );

  const filteredLoans = activeLoans.filter((l) =>
    !loanSearch ||
    l.borrower_name.toLowerCase().includes(loanSearch.toLowerCase()) ||
    l.asset_name.toLowerCase().includes(loanSearch.toLowerCase()) ||
    l.asset_code.toLowerCase().includes(loanSearch.toLowerCase())
  );

  const handleCreateLoan = async () => {
    if (!selectedAsset) { toast.error("Pilih aset terlebih dahulu"); return; }
    if (!borrowerName) { toast.error("Nama peminjam wajib diisi"); return; }
    if (!dueDate) { toast.error("Tanggal kembali wajib diisi"); return; }

    setLoading(true);
    try {
      await loanApi.create({
        asset_id: selectedAsset.id,
        borrower_name: borrowerName,
        borrower_contact: borrowerContact,
        loan_date: toISOString(loanDate),
        due_date: toISOString(dueDate),
        condition_at_loan: conditionAtLoan,
        notes: loanNotes,
      });
      toast.success(`Aset ${selectedAsset.name} berhasil dipinjamkan`);
      setSelectedAsset(null);
      setBorrowerName("");
      setBorrowerContact("");
      setLoanDate(new Date().toISOString().split("T")[0]);
      setDueDate("");
      setConditionAtLoan("OK");
      setLoanNotes("");
      await Promise.all([fetchStats(), fetchAvailableAssets(), fetchActiveLoans()]);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Gagal menyimpan peminjaman");
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async () => {
    if (!returnLoan) return;
    setLoading(true);
    try {
      await loanApi.return(returnLoan.id, {
        condition_at_return: returnCondition || returnLoan.condition_at_loan,
        notes: returnNotes,
      });
      toast.success(`Aset ${returnLoan.asset_name} berhasil dikembalikan`);
      setReturnDialogOpen(false);
      setReturnLoan(null);
      await Promise.all([fetchStats(), fetchAvailableAssets(), fetchActiveLoans()]);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Gagal memproses pengembalian");
    } finally {
      setLoading(false);
    }
  };

  const openReturnDialog = (loan: LoanWithAsset) => {
    setReturnLoan(loan);
    setReturnCondition(loan.condition_at_loan);
    setReturnNotes("");
    setReturnDialogOpen(true);
  };

  const getDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diff = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  if (initialLoading) {
    return (
      <>
        <Header fixed><Search className="me-auto" /><ThemeSwitch /><ConfigDrawer /><ProfileDropdown /></Header>
        <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
          <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Memuat...</p></div>
        </Main>
      </>
    );
  }

  return (
    <>
      <Header fixed><Search className="me-auto" /><ThemeSwitch /><ConfigDrawer /><ProfileDropdown /></Header>
      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card><CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-blue-500" />
              <div><p className="text-sm text-muted-foreground">Sedang Dipinjam</p><p className="text-2xl font-bold">{stats?.active ?? 0}</p></div>
            </div>
          </CardContent></Card>
          <Card><CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div><p className="text-sm text-muted-foreground">Terlambat</p><p className="text-2xl font-bold">{stats?.overdue ?? 0}</p></div>
            </div>
          </CardContent></Card>
          <Card><CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <div><p className="text-sm text-muted-foreground">Selesai</p><p className="text-2xl font-bold">{stats?.returned ?? 0}</p></div>
            </div>
          </CardContent></Card>
          <Card><CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-green-500" />
              <div><p className="text-sm text-muted-foreground">Tersedia</p><p className="text-2xl font-bold">{stats?.available ?? 0} / {stats?.total_assets ?? 0}</p></div>
            </div>
          </CardContent></Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 border-b pb-2">
          <Button
            variant={activeTab === "new" ? "default" : "outline"}
            onClick={() => setActiveTab("new")}
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Peminjaman Baru</span>
            <span className="sm:hidden">Baru</span>
          </Button>
          <Button
            variant={activeTab === "return" ? "default" : "outline"}
            onClick={() => setActiveTab("return")}
            className="flex-1"
          >
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Proses Pengembalian</span>
            <span className="sm:hidden">Kembali</span>
          </Button>
        </div>

        {activeTab === "new" && (
          <div className="grid gap-4 lg:grid-cols-4">
            <Card className="lg:col-span-3">
              <CardHeader><CardTitle>Daftar Aset Tersedia ({filteredAssets.length})</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="Cari aset..." value={assetSearch} onChange={(e) => setAssetSearch(e.target.value)} />
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-[500px] overflow-y-auto">
                  {filteredAssets.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      {assetSearch ? "Tidak ada aset yang cocok" : "Semua aset sedang dipinjam"}
                    </div>
                  ) : filteredAssets.map((asset) => (
                    <div key={asset.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedAsset?.id === asset.id ? "border-primary bg-primary/5" : "hover:border-primary/50"}`}
                      onClick={() => setSelectedAsset(asset)}>
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0"><p className="font-medium truncate">{asset.name}</p><p className="text-sm text-muted-foreground font-mono truncate">{asset.code}</p></div>
                        <Badge className={`${conditionColors[asset.condition] || "bg-green-500"} text-white shrink-0`}>{asset.condition}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader><CardTitle>Form Peminjaman</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {selectedAsset ? (
                  <div className="p-3 border border-primary/30 rounded-lg bg-primary/5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{selectedAsset.name}</p>
                        <p className="text-sm text-muted-foreground font-mono">{selectedAsset.code}</p>
                      </div>
                      <Badge className={`${conditionColors[selectedAsset.condition] || "bg-green-500"} text-white`}>
                        {selectedAsset.condition}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" className="mt-2 h-7" onClick={() => setSelectedAsset(null)}><X className="h-3 w-3 mr-1" />Ganti</Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Klik aset di daftar untuk memilih</p>
                )}
                <div className="space-y-2">
                  <Label htmlFor="borrowerName">Nama Peminjam <span className="text-red-500">*</span></Label>
                  <Input id="borrowerName" placeholder="Nama lengkap" value={borrowerName} onChange={(e) => setBorrowerName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="borrowerContact">Kontak (HP/Email)</Label>
                  <Input id="borrowerContact" placeholder="08xxxxxxxxxx" value={borrowerContact} onChange={(e) => setBorrowerContact(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="loanDate">Tgl Pinjam</Label>
                    <Input id="loanDate" type="date" value={loanDate} onChange={(e) => setLoanDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Tgl Kembali <span className="text-red-500">*</span></Label>
                    <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conditionAtLoan">Kondisi</Label>
                  <Select value={conditionAtLoan} onValueChange={setConditionAtLoan}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {conditionOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loanNotes">Catatan</Label>
                  <Input id="loanNotes" placeholder="Catatan..." value={loanNotes} onChange={(e) => setLoanNotes(e.target.value)} />
                </div>
                <Button className="w-full" onClick={handleCreateLoan} disabled={loading || !selectedAsset || !borrowerName || !dueDate}>
                  {loading ? "Menyimpan..." : "Pinjam Sekarang"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "return" && (
          <div className="grid gap-4 lg:grid-cols-4">
            <Card className="lg:col-span-3">
              <CardHeader><CardTitle>Aset Sedang Dipinjam ({filteredLoans.length})</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="Cari peminjam atau aset..." value={loanSearch} onChange={(e) => setLoanSearch(e.target.value)} />
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-[500px] overflow-y-auto">
                  {filteredLoans.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      {loanSearch ? "Tidak ada yang cocok" : "Tidak ada aset yang sedang dipinjam"}
                    </div>
                  ) : filteredLoans.map((loan) => {
                    const overdue = loan.status === "OVERDUE";
                    const daysOverdue = overdue ? getDaysOverdue(loan.due_date) : 0;
                    return (
                      <div key={loan.id} className={`p-3 border rounded-lg ${overdue ? "border-red-300 bg-red-50" : "hover:border-primary/50"}`}>
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0"><p className="font-medium truncate">{loan.asset_name}</p><p className="text-sm text-muted-foreground font-mono truncate">{loan.asset_code}</p></div>
                          <Badge className={`${statusColors[loan.status]} text-white shrink-0`}>{overdue ? `${daysOverdue} hari` : loan.status}</Badge>
                        </div>
                        <div className="mt-2 text-sm">
                          <p><span className="text-muted-foreground">Peminjam:</span> {loan.borrower_name}</p>
                          <p><span className="text-muted-foreground">Jatuh tempo:</span> {new Date(loan.due_date).toLocaleDateString("id-ID")}</p>
                        </div>
                        <Button className="w-full mt-3" variant={overdue ? "destructive" : "default"} size="sm" onClick={() => openReturnDialog(loan)}>
                          <Check className="h-4 w-4 mr-2" />Proses
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader><CardTitle>Form Pengembalian</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {returnLoan ? (
                  <>
                    <div className="p-3 border rounded-lg bg-muted/50">
                      <p className="font-medium">{returnLoan.asset_name}</p>
                      <p className="text-sm text-muted-foreground font-mono">{returnLoan.asset_code}</p>
                      <div className="mt-2 text-sm space-y-1">
                        <p><span className="text-muted-foreground">Peminjam:</span> {returnLoan.borrower_name}</p>
                        <p><span className="text-muted-foreground">Jatuh tempo:</span> {new Date(returnLoan.due_date).toLocaleDateString("id-ID")}</p>
                        <p><span className="text-muted-foreground">Kondisi Pinjam:</span> {returnLoan.condition_at_loan}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="returnCondition">Kondisi Kembali</Label>
                      <Select value={returnCondition} onValueChange={setReturnCondition}>
                        <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                        <SelectContent>
                          {conditionOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="returnNotes">Catatan</Label>
                      <Input id="returnNotes" placeholder="Catatan..." value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)} />
                    </div>
                    <Button className="w-full" onClick={handleReturn} disabled={loading}>
                      {loading ? "Memproses..." : "Kembalikan"}
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <ArrowLeftRight className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p>Klik aset di daftar untuk proses pengembalian</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </Main>

      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Konfirmasi Pengembalian</DialogTitle></DialogHeader>
          {returnLoan && (
            <div className="space-y-4 py-4">
              <div className="p-3 border rounded-lg">
                <p className="font-medium">{returnLoan.asset_name}</p>
                <p className="text-sm text-muted-foreground font-mono">{returnLoan.asset_code}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="returnConditionDialog">Kondisi Saat Kembali</Label>
                <Select value={returnCondition} onValueChange={setReturnCondition}>
                  <SelectTrigger><SelectValue placeholder="Pilih kondisi" /></SelectTrigger>
                  <SelectContent>
                    {conditionOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="returnNotesDialog">Catatan</Label>
                <Input id="returnNotesDialog" placeholder="Catatan..." value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnDialogOpen(false)}>Batal</Button>
            <Button onClick={handleReturn} disabled={loading}>{loading ? "Memproses..." : "Konfirmasi"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
