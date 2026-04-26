import { useState, useEffect, useRef } from "react";
import { useSearch } from "@tanstack/react-router";
import { Printer, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { assetApi, type Asset } from "@/lib/api";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

interface PrintSettings {
  institutionName: string;
  institutionLogo: string;
  rows: number;
  cols: number;
  labelWidth: number;
  labelHeight: number;
}

export function MassLabelPrint() {
  const searchParams = useSearch({ from: "/_authenticated/mass-label-print/" }) as { selectedIds?: number[] };
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set(searchParams.selectedIds || []));
  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    institutionName: "SMK NIBA",
    institutionLogo: "",
    rows: 7,
    cols: 3,
    labelWidth: 63.5,
    labelHeight: 25.4,
  });
  const [loading, setLoading] = useState(true);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
    fetchSettings();
  }, []);

  const fetchData = async () => {
    try {
      const res = await assetApi.getAll();
      setAssets(res.data);
    } catch {
      toast.error("Failed to fetch assets");
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings`);
      const data = await res.json();
      setPrintSettings({
        institutionName: data.institution_name || "SMK NIBA",
        institutionLogo: data.institution_logo || "",
        rows: data.label_rows || 7,
        cols: data.label_cols || 3,
        labelWidth: data.label_width || 63.5,
        labelHeight: data.label_height || 25.4,
      });
    } catch {
      // use defaults
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === assets.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(assets.map((a) => a.id)));
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
      toast.error("Pilih aset yang akan dicetak");
      return;
    }
    setShowPrintPreview(true);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const selectedAssets = assets.filter((a) => selectedIds.has(a.id));
  const labelsPerPage = printSettings.rows * printSettings.cols;
  const totalPages = Math.ceil(selectedAssets.length / labelsPerPage);

  const generateQRDataUrl = (assetId: number): string => {
    return `${window.location.origin}/public/asset/${assetId}`;
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Printer className="h-6 w-6" />
            Mass Label Print
          </h1>
          <p className="text-muted-foreground">
            Select assets to print labels in bulk ({selectedIds.size} selected)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setSelectedIds(new Set())}
            disabled={selectedIds.size === 0}
          >
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
          <Button onClick={handlePrint} disabled={selectedIds.size === 0}>
            <Printer className="h-4 w-4 mr-2" />
            Print {selectedIds.size} Labels
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Select Assets</span>
                <Button variant="ghost" size="sm" onClick={toggleSelectAll}>
                  {selectedIds.size === assets.length ? "Deselect All" : "Select All"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    onClick={() => toggleSelect(asset.id)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedIds.has(asset.id)
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedIds.has(asset.id)
                            ? "border-primary bg-primary"
                            : "border-muted-foreground"
                        }`}
                      >
                        {selectedIds.has(asset.id) && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate text-sm">{asset.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{asset.code}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Print Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Institution</p>
                <p className="font-medium">{printSettings.institutionName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Layout</p>
                <p className="font-medium">
                  {printSettings.rows} x {printSettings.cols} = {labelsPerPage} per page
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Labels</p>
                <p className="font-medium">{selectedIds.size}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pages</p>
                <p className="font-medium">{totalPages}</p>
              </div>
              {printSettings.institutionLogo && (
                <div>
                  <p className="text-sm text-muted-foreground">Logo</p>
                  <img
                    src={`${API_BASE}${printSettings.institutionLogo}`}
                    alt="Logo"
                    className="h-8 object-contain"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {showPrintPreview && (
        <div className="hidden print:block">
          <div ref={printRef} className="p-4">
            {Array.from({ length: totalPages }).map((_, pageIndex) => (
              <div
                key={pageIndex}
                className="grid gap-0"
                style={{
                  gridTemplateColumns: `repeat(${printSettings.cols}, ${printSettings.labelWidth}mm)`,
                  gridTemplateRows: `repeat(${printSettings.rows}, ${printSettings.labelHeight}mm)`,
                }}
              >
                {Array.from({ length: labelsPerPage }).map((_, labelIndex) => {
                  const assetIndex = pageIndex * labelsPerPage + labelIndex;
                  const asset = selectedAssets[assetIndex];
                  if (!asset) return <div key={labelIndex} className="border" />;

                  return (
                    <div
                      key={labelIndex}
                      className="border p-1 text-[8px] leading-tight overflow-hidden"
                      style={{
                        width: `${printSettings.labelWidth}mm`,
                        height: `${printSettings.labelHeight}mm`,
                      }}
                    >
                      <div className="flex items-start gap-1">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[9px] truncate">{asset.name}</p>
                          <p className="text-[7px] text-muted-foreground truncate">{asset.code}</p>
                        </div>
                        <div
                          className="w-10 h-10 bg-gray-200 flex items-center justify-center text-[6px] text-center"
                          dangerouslySetInnerHTML={{
                            __html: `<img src="https://api.qrserver.com/v1/create-qr-code/?size=40x40&data=${encodeURIComponent(generateQRDataUrl(asset.id))}" width="40" height="40" />`,
                          }}
                        />
                      </div>
                      <div className="mt-0.5">
                        <p className="text-[7px] truncate">{printSettings.institutionName}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
