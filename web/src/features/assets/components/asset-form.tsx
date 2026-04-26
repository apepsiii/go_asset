import { useEffect, useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import {
  assetApi,
  categoryApi,
  locationApi,
  budgetSourceApi,
  uploadApi,
  type Asset,
} from "@/lib/api";

const IT_CATEGORY_IDS = [1, 2, 3];

interface AssetFormData {
  code: string;
  name: string;
  category_id: string;
  budget_source_id: string;
  location_id: string;
  condition: string;
  specification: string;
  specifications: Record<string, any>;
  photo_url: string;
  purchase_date: string;
  price: string;
  warranty_expiry: string;
  useful_life_years: string;
  salvage_value: string;
}

interface AssetFormProps {
  mode: "create" | "edit";
}

export function AssetForm({ mode }: AssetFormProps) {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { id?: string };
  const assetId = params.id ? parseInt(params.id, 10) : undefined;

  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [locations, setLocations] = useState<{ id: number; name: string }[]>([]);
  const [budgetSources, setBudgetSources] = useState<{ id: number; name: string }[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<AssetFormData>({
    code: "",
    name: "",
    category_id: "",
    budget_source_id: "",
    location_id: "",
    condition: "OK",
    specification: "",
    specifications: {},
    photo_url: "",
    purchase_date: "",
    price: "",
    warranty_expiry: "",
    useful_life_years: "5",
    salvage_value: "0",
  });

  const selectedCategoryId = form.category_id;
  const showITSpecs = selectedCategoryId && IT_CATEGORY_IDS.includes(parseInt(selectedCategoryId, 10));

  const generateAssetCode = async (categoryId: string) => {
    if (!categoryId || mode === "edit") return;
    try {
      const res = await assetApi.generateCode(parseInt(categoryId, 10));
      setForm((prev) => ({ ...prev, code: res.data.code }));
    } catch {
      console.error("Failed to generate asset code");
    }
  };

  useEffect(() => {
    if (selectedCategoryId && mode === "create") {
      generateAssetCode(selectedCategoryId);
    }
  }, [selectedCategoryId, mode]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, locationsRes, budgetRes] = await Promise.all([
          categoryApi.getAll(),
          locationApi.getAll(),
          budgetSourceApi.getAll(),
        ]);
        setCategories(categoriesRes.data);
        setLocations(locationsRes.data);
        setBudgetSources(budgetRes.data);

        if (mode === "edit" && assetId) {
          const assetRes = await assetApi.getById(assetId);
          const asset = assetRes.data;
          setForm({
            code: asset.code,
            name: asset.name,
            category_id: asset.category_id?.toString() || "",
            budget_source_id: asset.budget_source_id?.toString() || "",
            location_id: asset.location_id?.toString() || "",
            condition: asset.condition,
            specification: asset.specification || "",
            specifications: asset.specifications ? JSON.parse(asset.specifications) : {},
            photo_url: asset.photo_url || "",
            purchase_date: asset.purchase_date ? asset.purchase_date.split("T")[0] : "",
            price: asset.price?.toString() || "",
            warranty_expiry: asset.warranty_expiry ? asset.warranty_expiry.split("T")[0] : "",
            useful_life_years: asset.useful_life_years?.toString() || "5",
            salvage_value: asset.salvage_value?.toString() || "0",
          });
        }
      } catch {
        toast.error("Failed to fetch data");
      }
    };
    fetchData();
  }, [mode, assetId]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const res = await uploadApi.upload(file);
      setForm({ ...form, photo_url: res.data.url });
      toast.success("Photo uploaded");
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const updateSpec = (key: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [key]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "create" && !form.code) {
        toast.error("Silakan pilih kategori terlebih dahulu untuk generate kode");
        setLoading(false);
        return;
      }
      if (!form.name) {
        toast.error("Asset name is required");
        setLoading(false);
        return;
      }

      const toISOString = (dateStr: string): string | null => {
        if (!dateStr) return null;
        if (dateStr.includes("T")) return dateStr;
        return `${dateStr}T00:00:00Z`;
      };

      const payload: Partial<Asset> = {
        code: form.code,
        name: form.name,
        condition: form.condition as Asset["condition"],
        specification: form.specification,
        specifications: JSON.stringify(form.specifications),
        photo_url: form.photo_url,
        purchase_date: toISOString(form.purchase_date),
        warranty_expiry: toISOString(form.warranty_expiry),
        category_id: form.category_id ? parseInt(form.category_id, 10) : null,
        budget_source_id: form.budget_source_id ? parseInt(form.budget_source_id, 10) : null,
        location_id: form.location_id ? parseInt(form.location_id, 10) : null,
        price: form.price ? parseFloat(form.price) : null,
        useful_life_years: form.useful_life_years ? parseInt(form.useful_life_years, 10) : 5,
        salvage_value: form.salvage_value ? parseFloat(form.salvage_value) : 0,
      };

      if (mode === "create") {
        await assetApi.create(payload);
        toast.success("Asset created");
        navigate({ to: "/assets" });
      } else if (assetId) {
        await assetApi.update(assetId, payload);
        toast.success("Asset updated");
        navigate({ to: "/assets/$id", params: { id: assetId.toString() } });
      }
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || `Failed to ${mode} asset`;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header fixed>
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/assets" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold ms-2">
          {mode === "create" ? "Add New Asset" : "Edit Asset"}
        </h1>
      </Header>

      <Main className="flex flex-1 flex-col gap-4 overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="code">Asset Code</Label>
                  <Input
                    id="code"
                    value={form.code}
                    readOnly={mode === "create"}
                    placeholder={mode === "create" ? "Auto-generated from category" : ""}
                    className={mode === "create" ? "bg-muted" : ""}
                  />
                  {mode === "create" && (
                    <p className="text-xs text-muted-foreground">
                      Code will be auto-generated based on category
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Asset Name *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., PC Desktop Acer Veriton"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select value={form.category_id} onValueChange={(val) => setForm({ ...form, category_id: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Location</Label>
                  <Select value={form.location_id} onValueChange={(val) => setForm({ ...form, location_id: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id.toString()}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Budget Source</Label>
                  <Select value={form.budget_source_id} onValueChange={(val) => setForm({ ...form, budget_source_id: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select budget source" />
                    </SelectTrigger>
                    <SelectContent>
                      {budgetSources.map((budget) => (
                        <SelectItem key={budget.id} value={budget.id.toString()}>
                          {budget.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Condition</Label>
                  <Select value={form.condition} onValueChange={(val) => setForm({ ...form, condition: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OK">OK</SelectItem>
                      <SelectItem value="RUSAK_RINGAN">Rusak Ringan</SelectItem>
                      <SelectItem value="RUSAK_TOTAL">Rusak Total</SelectItem>
                      <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">Price (Rp)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="e.g., 5000000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {showITSpecs && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">IT Specifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="spec.brand">Brand</Label>
                    <Input
                      id="spec.brand"
                      value={form.specifications.brand || ""}
                      onChange={(e) => updateSpec("brand", e.target.value)}
                      placeholder="e.g., Lenovo"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="spec.model">Model</Label>
                    <Input
                      id="spec.model"
                      value={form.specifications.model || ""}
                      onChange={(e) => updateSpec("model", e.target.value)}
                      placeholder="e.g., ThinkCentre M70s"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="spec.serialNumber">Serial Number</Label>
                  <Input
                    id="spec.serialNumber"
                    value={form.specifications.serialNumber || ""}
                    onChange={(e) => updateSpec("serialNumber", e.target.value)}
                    placeholder="e.g., PF3A1B2C"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="spec.cpu">CPU</Label>
                    <Input
                      id="spec.cpu"
                      value={form.specifications.cpu || ""}
                      onChange={(e) => updateSpec("cpu", e.target.value)}
                      placeholder="e.g., Intel Core i5-12400F"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="spec.ram">RAM</Label>
                    <Input
                      id="spec.ram"
                      value={form.specifications.ram || ""}
                      onChange={(e) => updateSpec("ram", e.target.value)}
                      placeholder="e.g., 16GB DDR4"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="spec.storage">Storage</Label>
                    <Input
                      id="spec.storage"
                      value={form.specifications.storage || ""}
                      onChange={(e) => updateSpec("storage", e.target.value)}
                      placeholder="e.g., 512GB NVMe SSD"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="spec.macAddress">MAC Address</Label>
                    <Input
                      id="spec.macAddress"
                      value={form.specifications.macAddress || ""}
                      onChange={(e) => updateSpec("macAddress", e.target.value)}
                      placeholder="e.g., 00:1B:44:11:3A:B7"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="spec.os">Operating System</Label>
                  <Input
                    id="spec.os"
                    value={form.specifications.os || ""}
                    onChange={(e) => updateSpec("os", e.target.value)}
                    placeholder="e.g., Windows 11 Pro"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="purchase_date">Purchase Date</Label>
                  <Input
                    id="purchase_date"
                    type="date"
                    value={form.purchase_date}
                    onChange={(e) => setForm({ ...form, purchase_date: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="warranty_expiry">Warranty Expiry</Label>
                  <Input
                    id="warranty_expiry"
                    type="date"
                    value={form.warranty_expiry}
                    onChange={(e) => setForm({ ...form, warranty_expiry: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="useful_life_years">Useful Life (Years)</Label>
                  <Input
                    id="useful_life_years"
                    type="number"
                    value={form.useful_life_years}
                    onChange={(e) => setForm({ ...form, useful_life_years: e.target.value })}
                    placeholder="e.g., 5"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="salvage_value">Salvage Value (Rp)</Label>
                  <Input
                    id="salvage_value"
                    type="number"
                    value={form.salvage_value}
                    onChange={(e) => setForm({ ...form, salvage_value: e.target.value })}
                    placeholder="e.g., 0"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="specification">Specification</Label>
                <Textarea
                  id="specification"
                  value={form.specification}
                  onChange={(e) => setForm({ ...form, specification: e.target.value })}
                  placeholder="General specifications..."
                />
              </div>

              <div className="grid gap-2">
                <Label>Photo</Label>
                <div className="flex gap-2 items-center">
                  <Input type="file" accept="image/*" onChange={handlePhotoChange} className="flex-1" />
                  {uploadingPhoto && <span className="text-sm text-muted-foreground">Uploading...</span>}
                </div>
                {form.photo_url && (
                  <div className="mt-2">
                    <img
                      src={`${import.meta.env.VITE_API_URL}${form.photo_url}`}
                      alt="Preview"
                      className="h-32 object-contain border rounded"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/assets" })}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : mode === "create" ? "Create Asset" : "Update Asset"}
            </Button>
          </div>
        </form>
      </Main>
    </>
  );
}
