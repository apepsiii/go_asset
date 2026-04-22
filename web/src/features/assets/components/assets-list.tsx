import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Archive, Pencil, Trash2, Eye, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { assetApi, categoryApi, locationApi, type Asset } from "@/lib/api";

const conditionColors: Record<string, string> = {
  OK: "bg-green-500",
  RUSAK_RINGAN: "bg-yellow-500",
  RUSAK_TOTAL: "bg-red-500",
  MAINTENANCE: "bg-blue-500",
};

export function AssetsList() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [locations, setLocations] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  const [search, setSearch] = useState("");
  const [filterLocation, setFilterLocation] = useState<string>("all");
  const [filterCondition, setFilterCondition] = useState<string>("all");

  const fetchData = async () => {
    try {
      const [assetsRes, categoriesRes, locationsRes] = await Promise.all([
        assetApi.getAll(),
        categoryApi.getAll(),
        locationApi.getAll(),
      ]);
      setAssets(assetsRes.data);
      setCategories(categoriesRes.data);
      setLocations(locationsRes.data);
    } catch {
      toast.error("Failed to fetch assets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await assetApi.delete(deleteId);
      setAssets((prev) => prev.filter((a) => a.id !== deleteId));
      toast.success("Asset deleted");
    } catch {
      toast.error("Failed to delete asset");
    }
    setDeleteId(null);
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      search === "" ||
      asset.name.toLowerCase().includes(search.toLowerCase()) ||
      asset.code.toLowerCase().includes(search.toLowerCase());
    const matchesLocation =
      filterLocation === "all" || asset.location_id?.toString() === filterLocation;
    const matchesCondition =
      filterCondition === "all" || asset.condition === filterCondition;
    return matchesSearch && matchesLocation && matchesCondition;
  });

  const getCategoryName = (id: number | null) => {
    if (!id) return "-";
    return categories.find((c) => c.id === id)?.name || "-";
  };

  const getLocationName = (id: number | null) => {
    if (!id) return "-";
    return locations.find((l) => l.id === id)?.name || "-";
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Archive className="h-6 w-6" /> Assets
          </h2>
          <p className="text-muted-foreground">
            Manage lab assets inventory
          </p>
        </div>
        <Button onClick={() => navigate({ to: "/assets/new" })}>
          <Plus className="mr-2 h-4 w-4" />
          Add Asset
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search by name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={filterLocation} onValueChange={setFilterLocation}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map((loc) => (
              <SelectItem key={loc.id} value={loc.id.toString()}>
                {loc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCondition} onValueChange={setFilterCondition}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Condition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Conditions</SelectItem>
            <SelectItem value="OK">OK</SelectItem>
            <SelectItem value="RUSAK_RINGAN">Rusak Ringan</SelectItem>
            <SelectItem value="RUSAK_TOTAL">Rusak Total</SelectItem>
            <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAssets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No assets found
                </TableCell>
              </TableRow>
            ) : (
              filteredAssets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell className="font-mono text-sm">{asset.code}</TableCell>
                  <TableCell>{asset.name}</TableCell>
                  <TableCell>{getCategoryName(asset.category_id)}</TableCell>
                  <TableCell>{getLocationName(asset.location_id)}</TableCell>
                  <TableCell>
                    <Badge
                      className={conditionColors[asset.condition] + " text-white"}
                    >
                      {asset.condition}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate({ to: `/assets/${asset.id}` })}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          navigate({ to: `/assets/${asset.id}/edit` })
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(asset.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
    </div>
  );
}
