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
import {
  assetApi,
  categoryApi,
  locationApi,
  budgetSourceApi,
  uploadApi,
  type Asset,
} from "@/lib/api";

interface AssetFormProps {
  mode: "create" | "edit";
}

export function AssetForm({ mode }: AssetFormProps) {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { id?: string };
  const assetId = params.id ? parseInt(params.id, 10) : undefined;

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [locations, setLocations] = useState<{ id: number; name: string }[]>([]);
  const [budgetSources, setBudgetSources] = useState<{ id: number; name: string }[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [form, setForm] = useState({
    code: "",
    name: "",
    category_id: "" as string,
    budget_source_id: "" as string,
    location_id: "" as string,
    condition: "OK",
    specification: "",
    photo_url: "",
    purchase_date: "",
    price: "" as string,
    warranty_expiry: "",
  });

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
            photo_url: asset.photo_url || "",
            purchase_date: asset.purchase_date || "",
            price: asset.price?.toString() || "",
            warranty_expiry: asset.warranty_expiry || "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: Partial<Asset> = {
        code: form.code,
        name: form.name,
        condition: form.condition as Asset["condition"],
        specification: form.specification,
        photo_url: form.photo_url,
        purchase_date: form.purchase_date || null,
        warranty_expiry: form.warranty_expiry || null,
        category_id: form.category_id ? parseInt(form.category_id, 10) : null,
        budget_source_id: form.budget_source_id ? parseInt(form.budget_source_id, 10) : null,
        location_id: form.location_id ? parseInt(form.location_id, 10) : null,
        price: form.price ? parseFloat(form.price) : null,
      };

      if (mode === "create") {
        await assetApi.create(payload);
        toast.success("Asset created");
      } else if (assetId) {
        await assetApi.update(assetId, payload);
        toast.success("Asset updated");
      }

      navigate({ to: "/assets" });
    } catch {
      toast.error(`Failed to ${mode} asset`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/assets" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          {mode === "create" ? "Add New Asset" : "Edit Asset"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="code">Asset Code *</Label>
                <Input
                  id="code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="e.g., PC-LAB1-001"
                  required
                />
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
                <Select
                  value={form.category_id}
                  onValueChange={(val) => setForm({ ...form, category_id: val })}
                >
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
                <Select
                  value={form.location_id}
                  onValueChange={(val) => setForm({ ...form, location_id: val })}
                >
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
                <Select
                  value={form.budget_source_id}
                  onValueChange={(val) => setForm({ ...form, budget_source_id: val })}
                >
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
                <Select
                  value={form.condition}
                  onValueChange={(val) => setForm({ ...form, condition: val })}
                >
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
            <div className="grid gap-2">
              <Label htmlFor="specification">Specification</Label>
              <Textarea
                id="specification"
                value={form.specification}
                onChange={(e) => setForm({ ...form, specification: e.target.value })}
                placeholder="CPU: Intel Core i5-12400&#10;RAM: 8GB DDR4&#10;Storage: 256GB SSD&#10;SN: ABC123456"
                rows={5}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Photo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="photo">Upload Photo</Label>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                disabled={uploadingPhoto}
              />
              {uploadingPhoto && <p className="text-sm text-muted-foreground">Uploading...</p>}
            </div>
            {form.photo_url && (
              <div>
                <img
                  src={import.meta.env.VITE_API_URL + form.photo_url}
                  alt="Asset preview"
                  className="max-w-xs h-auto rounded-md border"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={() => navigate({ to: "/assets" })}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : mode === "create" ? "Create Asset" : "Update Asset"}
          </Button>
        </div>
      </form>
    </div>
  );
}
