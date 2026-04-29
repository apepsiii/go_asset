import { useState, useRef, useEffect } from "react";
import { Camera, Check, X, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

interface QuickLoanResult {
  success: boolean;
  message: string;
  asset_code?: string;
  asset_name?: string;
  borrower_name?: string;
  due_date?: string;
}

export function QuickLoan() {
  const [scanning, setScanning] = useState(false);
  const [manualId, setManualId] = useState("");
  const [borrowerName, setBorrowerName] = useState("");
  const [pin, setPin] = useState("");
  const [duration, setDuration] = useState("7");
  const [result, setResult] = useState<QuickLoanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setScanning(true);
      setError(null);
    } catch {
      setError("Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = detectQRCode(imageData);
      if (code && code !== lastScanned) {
        setLastScanned(code);
        handleAssetScanned(code);
      }
    } catch {
      // Continue scanning
    }

    if (scanning) {
      requestAnimationFrame(scanQRCode);
    }
  };

  useEffect(() => {
    if (scanning) {
      scanQRCode();
    }
  }, [scanning, lastScanned]);

  const detectQRCode = (_imageData: ImageData): string | null => {
    return null;
  };

  const handleAssetScanned = (assetId: string) => {
    const numericId = assetId.replace(/[^0-9]/g, "");
    if (numericId) {
      setManualId(numericId);
      stopCamera();
    }
  };

  const handleManualSubmit = () => {
    if (manualId) {
      handleAssetScanned(manualId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId || !borrowerName || !pin) {
      setError("Semua field harus diisi");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/loans/quick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset_id: parseInt(manualId, 10),
          borrower_name: borrowerName,
          admin_pin: pin,
          duration_days: parseInt(duration, 10),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Terjadi kesalahan");
        return;
      }

      setResult({
        success: true,
        message: "Peminjaman berhasil!",
        asset_code: data.asset_code,
        asset_name: data.asset_name,
        borrower_name: data.borrower_name,
        due_date: data.due_date,
      });

      setManualId("");
      setBorrowerName("");
      setPin("");
      setDuration("7");
    } catch {
      setError("Tidak dapat terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  const resetAndScanAgain = () => {
    setResult(null);
    setError(null);
    setManualId("");
    setBorrowerName("");
    setPin("");
    setLastScanned(null);
  };

  if (result?.success) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-green-200 bg-white">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-700 mb-2">Berhasil!</h2>
            <p className="text-green-600 mb-6">Peminjaman berhasil dicatat</p>

            <div className="bg-green-50 rounded-lg p-4 mb-6 text-left">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Aset:</span>
                  <span className="font-medium">{result.asset_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kode:</span>
                  <span className="font-mono">{result.asset_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Peminjam:</span>
                  <span className="font-medium">{result.borrower_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Jatuh Tempo:</span>
                  <span className="font-medium">
                    {result.due_date ? new Date(result.due_date).toLocaleDateString("id-ID") : "-"}
                  </span>
                </div>
              </div>
            </div>

            <Button onClick={resetAndScanAgain} className="w-full" size="lg">
              <Camera className="h-5 w-5 mr-2" />
              Scan Barang Berikutnya
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-primary text-primary-foreground p-4">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Camera className="h-6 w-6" />
          Quick Loan - Lab Asset
        </h1>
        <p className="text-sm opacity-80">Scan QR untuk pinjam aset</p>
      </header>

      <div className="flex-1 p-4 space-y-4">
        {!scanning && !manualId && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Scan QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Camera className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p>Kamera tidak aktif</p>
                </div>
              </div>
              <Button onClick={startCamera} className="w-full" size="lg">
                <Camera className="h-5 w-5 mr-2" />
                Aktifkan Kamera
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-gray-50 px-2 text-muted-foreground">atau</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manualId">Input Manual ID Aset</Label>
                <div className="flex gap-2">
                  <Input
                    id="manualId"
                    type="number"
                    placeholder="Ketik ID aset..."
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value)}
                  />
                  <Button onClick={handleManualSubmit} disabled={!manualId}>
                    OK
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {scanning && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Camera className="h-5 w-5 animate-pulse" />
                Memindai...
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-square bg-black rounded-lg overflow-hidden relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-4 border-white rounded-lg" />
                </div>
              </div>
              <Button onClick={stopCamera} variant="outline" className="w-full">
                <X className="h-5 w-5 mr-2" />
                Batal
              </Button>
            </CardContent>
          </Card>
        )}

        {manualId && !result && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Form Peminjaman</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-700">ID Aset Terdeteksi</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-800">#{manualId}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-blue-600"
                    onClick={() => {
                      setManualId("");
                      setLastScanned(null);
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Ganti
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="borrowerName">Nama Peminjam *</Label>
                  <Input
                    id="borrowerName"
                    placeholder="Nama siswa atau guru..."
                    value={borrowerName}
                    onChange={(e) => setBorrowerName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Durasi Peminjaman</Label>
                  <select
                    id="duration"
                    className="w-full h-10 px-3 border rounded-md bg-background"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  >
                    <option value="1">1 hari</option>
                    <option value="3">3 hari</option>
                    <option value="7">7 hari (1 minggu)</option>
                    <option value="14">14 hari (2 minggu)</option>
                    <option value="30">30 hari (1 bulan)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pin">PIN Admin *</Label>
                  <Input
                    id="pin"
                    type="password"
                    maxLength={6}
                    placeholder="Masukkan PIN..."
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <Check className="h-5 w-5 mr-2" />
                      Konfirmasi Peminjaman
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      <footer className="p-4 text-center text-xs text-muted-foreground border-t bg-white">
        Lab Asset Manager - SMK Edition
      </footer>
    </div>
  );
}
