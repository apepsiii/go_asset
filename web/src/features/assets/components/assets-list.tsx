import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Archive, Pencil, Trash2, Eye, Plus, CheckSquare, Square, X, RefreshCw, LayoutGrid, LayoutList, Printer } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { assetApi, categoryApi, locationApi, type Asset } from "@/lib/api";
import { useIsMobile } from "@/hooks/use-mobile";

const conditionColors: Record<string, string> = {
  OK: "bg-green-500",
  RUSAK_RINGAN: "bg-yellow-500",
  RUSAK_TOTAL: "bg-red-500",
  MAINTENANCE: "bg-blue-500",
};

const conditions = [
  { value: "OK", label: "Baik (OK)" },
  { value: "RUSAK_RINGAN", label: "Rusak Ringan" },
  { value: "RUSAK_TOTAL", label: "Rusak Total" },
  { value: "MAINTENANCE", label: "Maintenance" },
];

export function AssetsList() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [locations, setLocations] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkConditionDialog, setBulkConditionDialog] = useState(false);
  const [bulkCondition, setBulkCondition] = useState("");
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  const [search, setSearch] = useState("");
  const [filterLocation, setFilterLocation] = useState<string>("all");
  const [filterCondition, setFilterCondition] = useState<string>("all");

  useEffect(() => {
    if (isMobile) {
      setViewMode("cards");
    }
  }, [isMobile]);

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

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkLoading(true);
    try {
      await assetApi.bulkDelete(ids);
      setAssets((prev) => prev.filter((a) => !selectedIds.has(a.id)));
      setSelectedIds(new Set());
      toast.success(`${ids.length} assets deleted`);
    } catch {
      toast.error("Failed to delete assets");
    } finally {
      setBulkLoading(false);
      setBulkDeleteDialog(false);
    }
  };

  const handleBulkUpdateCondition = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0 || !bulkCondition) return;
    setBulkLoading(true);
    try {
      await assetApi.bulkUpdateCondition(ids, bulkCondition);
      setAssets((prev) =>
        prev.map((a) =>
          selectedIds.has(a.id) ? { ...a, condition: bulkCondition as Asset["condition"] } : a
        )
      );
      setSelectedIds(new Set());
      toast.success(`Updated condition for ${ids.length} assets`);
    } catch {
      toast.error("Failed to update assets");
    } finally {
      setBulkLoading(false);
      setBulkConditionDialog(false);
      setBulkCondition("");
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAssets.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAssets.map((a) => a.id)));
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
    <>
      <div className='flex flex-col sm:flex-row flex-wrap items-start sm:items-end justify-between gap-2'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight flex items-center gap-2'>
            <Archive className='h-6 w-6' /> Assets
          </h2>
          <p className='text-muted-foreground'>
            Manage lab assets inventory
          </p>
        </div>
        <div className="flex gap-2">
          {!isMobile && (
            <div className="flex border rounded-md overflow-hidden">
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-none"
                onClick={() => setViewMode("table")}
              >
                <LayoutList className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "cards" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-none"
                onClick={() => setViewMode("cards")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          )}
          <Button onClick={() => navigate({ to: '/assets/new' })}>
            <Plus className='mr-2 h-4 w-4' />
            Add Asset
          </Button>
        </div>
      </div>

      <div className='flex flex-1 flex-col gap-4'>
        <div className='flex flex-col sm:flex-row gap-2'>
          <Input
            placeholder='Search by name or code...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='w-full sm:max-w-xs'
          />
          <Select value={filterLocation} onValueChange={setFilterLocation}>
            <SelectTrigger className='w-full sm:w-[180px]'>
              <SelectValue placeholder='Location' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Locations</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id.toString()}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCondition} onValueChange={setFilterCondition}>
            <SelectTrigger className='w-full sm:w-[180px]'>
              <SelectValue placeholder='Condition' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Conditions</SelectItem>
              <SelectItem value='OK'>OK</SelectItem>
              <SelectItem value='RUSAK_RINGAN'>Rusak Ringan</SelectItem>
              <SelectItem value='RUSAK_TOTAL'>Rusak Total</SelectItem>
              <SelectItem value='MAINTENANCE'>Maintenance</SelectItem>
            </SelectContent>
          </Select>

          {selectedIds.size > 0 && (
            <div className='flex items-center gap-2 ml-auto'>
              <span className='text-sm text-muted-foreground hidden sm:inline'>
                {selectedIds.size} selected
              </span>
              <span className='text-sm text-muted-foreground sm:hidden'>
                {selectedIds.size}
              </span>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setBulkConditionDialog(true)}
                className="hidden sm:flex"
              >
                <RefreshCw className='h-4 w-4 mr-2' />
                Update Condition
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setBulkConditionDialog(true)}
                className="flex sm:hidden px-2"
              >
                <RefreshCw className='h-4 w-4' />
              </Button>
              <Button
                variant='default'
                size='sm'
                onClick={() => navigate({
                  to: '/mass-label-print',
                  search: { selectedIds: Array.from(selectedIds) }
                })}
              >
                <Printer className='h-4 w-4 mr-2' />
                Print Labels
              </Button>
              <Button
                variant='destructive'
                size='sm'
                onClick={() => setBulkDeleteDialog(true)}
              >
                <Trash2 className='h-4 w-4' />
              </Button>
              <Button variant='ghost' size='sm' onClick={() => setSelectedIds(new Set())}>
                <X className='h-4 w-4' />
              </Button>
            </div>
          )}
        </div>

        {viewMode === "table" ? (
          <div className='overflow-x-auto rounded-md border'>
            <Table className='min-w-[600px]'>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-10'>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={toggleSelectAll}
                      className='h-8 w-8 p-0'
                    >
                      {selectedIds.size === filteredAssets.length && filteredAssets.length > 0 ? (
                        <CheckSquare className='h-4 w-4' />
                      ) : (
                        <Square className='h-4 w-4' />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Category</TableHead>
                  <TableHead className="hidden md:table-cell">Location</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No assets found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssets.map((asset) => (
                    <TableRow key={asset.id} className={selectedIds.has(asset.id) ? "bg-muted" : ""}>
                      <TableCell>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => toggleSelect(asset.id)}
                          className='h-8 w-8 p-0'
                        >
                          {selectedIds.has(asset.id) ? (
                            <CheckSquare className='h-4 w-4' />
                          ) : (
                            <Square className='h-4 w-4' />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{asset.code}</TableCell>
                      <TableCell>{asset.name}</TableCell>
                      <TableCell className="hidden sm:table-cell">{getCategoryName(asset.category_id)}</TableCell>
                      <TableCell className="hidden md:table-cell">{getLocationName(asset.location_id)}</TableCell>
                      <TableCell>
                        <Badge
                          className={conditionColors[asset.condition] + " text-white"}
                        >
                          {asset.condition}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 sm:gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate({ to: `/assets/${asset.id}` })}
                            className="h-8 w-8"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              navigate({ to: `/assets/${asset.id}/edit` })
                            }
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(asset.id)}
                            className="h-8 w-8"
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
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAssets.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No assets found
              </div>
            ) : (
              filteredAssets.map((asset) => (
                <Card
                  key={asset.id}
                  className={`cursor-pointer transition-colors ${
                    selectedIds.has(asset.id) ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => toggleSelect(asset.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">{asset.name}</CardTitle>
                        <p className="text-sm text-muted-foreground font-mono">{asset.code}</p>
                      </div>
                      <Badge
                        className={conditionColors[asset.condition] + " text-white shrink-0"}
                      >
                        {asset.condition}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Category: </span>
                      {getCategoryName(asset.category_id)}
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Location: </span>
                      {getLocationName(asset.location_id)}
                    </div>
                    <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate({ to: `/assets/${asset.id}` })}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate({ to: `/assets/${asset.id}/edit` })}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
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

      <Dialog open={bulkConditionDialog} onOpenChange={setBulkConditionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Condition for {selectedIds.size} Assets</DialogTitle>
          </DialogHeader>
          <div className='py-4 space-y-4'>
            <div className='space-y-2'>
              <Label>New Condition</Label>
              <Select value={bulkCondition} onValueChange={setBulkCondition}>
                <SelectTrigger>
                  <SelectValue placeholder='Select condition' />
                </SelectTrigger>
                <SelectContent>
                  {conditions.map((cond) => (
                    <SelectItem key={cond.value} value={cond.value}>
                      {cond.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setBulkConditionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkUpdateCondition} disabled={!bulkCondition || bulkLoading}>
              {bulkLoading ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={bulkDeleteDialog} onOpenChange={setBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} Assets</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.size} assets? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {bulkLoading ? "Deleting..." : "Delete All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
