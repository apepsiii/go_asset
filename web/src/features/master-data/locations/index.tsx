import { useState, useEffect } from "react";
import { toast } from "sonner";
import { MapPin } from "lucide-react";
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
import { MasterDataPage } from "@/features/master-data/components/master-data-page";
import { LocationsDialogs } from "./locations-dialogs";
import { locationApi, type Location } from "@/lib/api";

export function Locations() {
  const [items, setItems] = useState<Location[]>([]);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Location | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    try {
      const res = await locationApi.getAll();
      setItems(res.data);
    } catch {
      toast.error("Failed to fetch locations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleEdit = (item: Location) => {
    setEditItem(item);
    setOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await locationApi.delete(deleteId);
      setItems((prev) => prev.filter((i) => i.id !== deleteId));
      toast.success("Location deleted");
    } catch {
      toast.error("Failed to delete location");
    }
    setDeleteId(null);
  };

  const handleSuccess = () => {
    setEditItem(null);
    fetchItems();
    toast.success(editItem ? "Location updated" : "Location created");
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setEditItem(null);
    }
    setOpen(open);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <MasterDataPage
        title="Locations"
        items={items}
        onAdd={() => setOpen(true)}
        onEdit={handleEdit}
        onDelete={setDeleteId}
        icon={<MapPin className="h-6 w-6" />}
        description="Manage asset locations (Lab 1, Lab 2, Ruang Server, etc.)"
      />

      <LocationsDialogs
        open={open}
        onOpenChange={handleOpenChange}
        editItem={editItem}
        onSuccess={handleSuccess}
      />

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this location? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
