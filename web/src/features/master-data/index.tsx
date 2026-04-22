import { useState } from "react";
import { toast } from "sonner";
import { useMasterDataStore } from "@/features/master-data/store/master-data-store";
import { categoryApi, type Category } from "@/lib/api";
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
import { CategoriesProvider } from "./components/categories-provider";
import { CategoriesTable } from "./components/categories-table";
import { CategoriesDialogs } from "./components/categories-dialogs";
import { CategoriesPrimaryButtons } from "./components/categories-primary-buttons";
import { Laptop } from "lucide-react";

function CategoriesContent() {
  const [open, setOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { deleteCategory } = useMasterDataStore();

  const handleEdit = (category: Category) => {
    setEditCategory(category);
    setOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await categoryApi.delete(deleteId);
      deleteCategory(deleteId);
      toast.success("Category deleted");
    } catch {
      toast.error("Failed to delete category");
    }
    setDeleteId(null);
  };

  const handleSuccess = () => {
    setEditCategory(null);
    toast.success(editCategory ? "Category updated" : "Category created");
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setEditCategory(null);
    }
    setOpen(open);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Laptop className="h-6 w-6" /> Categories
          </h2>
          <p className="text-muted-foreground">
            Manage asset categories (Laptop, PC Desktop, Switch, etc.)
          </p>
        </div>
        <CategoriesPrimaryButtons onClick={() => setOpen(true)} />
      </div>

      <CategoriesTable onEdit={handleEdit} onDelete={setDeleteId} />

      <CategoriesDialogs
        open={open}
        onOpenChange={handleOpenChange}
        editCategory={editCategory}
        onSuccess={handleSuccess}
      />

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? This action cannot be
              undone.
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

export function Categories() {
  return (
    <CategoriesProvider>
      <CategoriesContent />
    </CategoriesProvider>
  );
}
