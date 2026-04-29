import { useState, useEffect } from "react";
import { Printer, Upload, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

interface AppSettings {
  institution_name: string;
  institution_logo: string;
  address: string;
  phone: string;
  label_rows: number;
  label_cols: number;
  label_width: number;
  label_height: number;
  maint_label_width: number;
  maint_label_height: number;
  maint_label_cols: number;
  maint_label_rows: number;
  maint_label_margin_top: number;
  maint_label_margin_left: number;
  maint_label_gap_h: number;
  maint_label_gap_v: number;
  maint_label_font_size: number;
}

export function LabelSettings() {
  const [settings, setSettings] = useState<AppSettings>({
    institution_name: "",
    institution_logo: "",
    address: "",
    phone: "",
    label_rows: 4,
    label_cols: 5,
    label_width: 38.0,
    label_height: 68.0,
    maint_label_width: 64.0,
    maint_label_height: 32.0,
    maint_label_cols: 4,
    maint_label_rows: 6,
    maint_label_margin_top: 5.0,
    maint_label_margin_left: 2.0,
    maint_label_gap_h: 2.0,
    maint_label_gap_v: 2.0,
    maint_label_font_size: 8.0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings`);
      const data = await res.json();
      setSettings(prev => ({ ...prev, ...data }));
    } catch {
      toast.error("Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        toast.success("Settings saved");
      } else {
        toast.error("Failed to save settings");
      }
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("logo", file);

    try {
      const res = await fetch(`${API_BASE}/api/settings/logo`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setSettings({ ...settings, institution_logo: data.url });
        toast.success("Logo uploaded");
      }
    } catch {
      toast.error("Failed to upload logo");
    } finally {
      setUploading(false);
    }
  };

  const updateField = <K extends keyof AppSettings>(field: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Printer className="h-5 w-5" />
          Label Settings
        </h2>
        <p className="text-muted-foreground">Configure institution info and label layout for printing</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Institution Information</CardTitle>
            <CardDescription>Used on labels and reports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Institution Name</Label>
              <Input
                value={settings.institution_name}
                onChange={(e) => updateField("institution_name", e.target.value)}
                placeholder="SMK NIBA"
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={settings.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="Jl. Merdeka No. 123"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={settings.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="021-12345678"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Logo</CardTitle>
            <CardDescription>School logo for labels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings.institution_logo && (
              <div className="border rounded-lg p-4 flex items-center justify-center bg-gray-50">
                <img
                  src={`${API_BASE}${settings.institution_logo}`}
                  alt="Logo"
                  className="h-16 object-contain"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Upload Logo</Label>
              <div className="flex gap-2">
                <Input type="file" accept="image/*" onChange={handleLogoUpload} className="flex-1" />
                <Button variant="outline" disabled={uploading}>
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "..." : "Upload"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>A4 Sticker Layout (Asset Label)</CardTitle>
            <CardDescription>Configure grid layout for mass label printing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Rows</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={settings.label_rows}
                  onChange={(e) => updateField("label_rows", parseInt(e.target.value) || 4)}
                />
                <p className="text-xs text-muted-foreground">Default: 4 (untuk 20 label)</p>
              </div>
              <div className="space-y-2">
                <Label>Columns</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={settings.label_cols}
                  onChange={(e) => updateField("label_cols", parseInt(e.target.value) || 3)}
                />
              </div>
              <div className="space-y-2">
                <Label>Width (mm)</Label>
                <Input
                  type="number"
                  step={0.1}
                  min={10}
                  max={100}
                  value={settings.label_width}
                  onChange={(e) => updateField("label_width", parseFloat(e.target.value) || 63.5)}
                />
              </div>
              <div className="space-y-2">
                <Label>Height (mm)</Label>
                <Input
                  type="number"
                  step={0.1}
                  min={10}
                  max={100}
                  value={settings.label_height}
                  onChange={(e) => updateField("label_height", parseFloat(e.target.value) || 25.4)}
                />
              </div>
            </div>

            <Separator />

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Preview: {settings.label_rows * settings.label_cols} labels per page</h4>
              <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${settings.label_cols}, 1fr)` }}>
                {Array.from({ length: Math.min(settings.label_rows * settings.label_cols, 21) }).map((_, i) => (
                  <div key={i} className="border border-blue-300 rounded bg-white aspect-[63.5/25.4] flex items-center justify-center text-xs text-blue-400">
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Maintenance Label Layout (Tom & Jerry 103)</CardTitle>
            <CardDescription>Configure grid layout for maintenance label printing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Label Width (mm)</Label>
                <Input
                  type="number"
                  step={0.1}
                  min={10}
                  max={200}
                  value={settings.maint_label_width}
                  onChange={(e) => updateField("maint_label_width", parseFloat(e.target.value) || 64)}
                />
              </div>
              <div className="space-y-2">
                <Label>Label Height (mm)</Label>
                <Input
                  type="number"
                  step={0.1}
                  min={10}
                  max={200}
                  value={settings.maint_label_height}
                  onChange={(e) => updateField("maint_label_height", parseFloat(e.target.value) || 32)}
                />
              </div>
              <div className="space-y-2">
                <Label>Columns</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={settings.maint_label_cols}
                  onChange={(e) => updateField("maint_label_cols", parseInt(e.target.value) || 4)}
                />
              </div>
              <div className="space-y-2">
                <Label>Rows</Label>
                <Input
                  type="number"
                  min={1}
                  max={15}
                  value={settings.maint_label_rows}
                  onChange={(e) => updateField("maint_label_rows", parseInt(e.target.value) || 6)}
                />
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Margin Top (mm)</Label>
                <Input
                  type="number"
                  step={0.1}
                  min={0}
                  max={50}
                  value={settings.maint_label_margin_top}
                  onChange={(e) => updateField("maint_label_margin_top", parseFloat(e.target.value) || 5)}
                />
              </div>
              <div className="space-y-2">
                <Label>Margin Left (mm)</Label>
                <Input
                  type="number"
                  step={0.1}
                  min={0}
                  max={50}
                  value={settings.maint_label_margin_left}
                  onChange={(e) => updateField("maint_label_margin_left", parseFloat(e.target.value) || 2)}
                />
              </div>
              <div className="space-y-2">
                <Label>Gap Horizontal (mm)</Label>
                <Input
                  type="number"
                  step={0.1}
                  min={0}
                  max={20}
                  value={settings.maint_label_gap_h}
                  onChange={(e) => updateField("maint_label_gap_h", parseFloat(e.target.value) || 2)}
                />
              </div>
              <div className="space-y-2">
                <Label>Gap Vertical (mm)</Label>
                <Input
                  type="number"
                  step={0.1}
                  min={0}
                  max={20}
                  value={settings.maint_label_gap_v}
                  onChange={(e) => updateField("maint_label_gap_v", parseFloat(e.target.value) || 2)}
                />
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Font Size (pt)</Label>
                <Input
                  type="number"
                  step={0.5}
                  min={3}
                  max={12}
                  value={settings.maint_label_font_size}
                  onChange={(e) => updateField("maint_label_font_size", parseFloat(e.target.value) || 5)}
                />
              </div>
            </div>

            <Separator />

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">
                Preview: {settings.maint_label_cols * settings.maint_label_rows} labels per page
              </h4>
              <p className="text-sm text-green-700 mb-3">
                Label Size: {settings.maint_label_width}mm x {settings.maint_label_height}mm
              </p>
              <div
                className="grid gap-1 bg-white p-2 rounded border border-green-300"
                style={{
                  gridTemplateColumns: `repeat(${settings.maint_label_cols}, 1fr)`,
                  width: 'fit-content'
                }}
              >
                {Array.from({ length: Math.min(settings.maint_label_cols * settings.maint_label_rows, 24) }).map((_, i) => (
                  <div
                    key={i}
                    className="border border-green-400 rounded flex items-center justify-center text-xs text-green-600 bg-green-50"
                    style={{
                      width: `${settings.maint_label_width / 4}px`,
                      height: `${settings.maint_label_height / 4}px`,
                      minWidth: '20px',
                      minHeight: '15px'
                    }}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}