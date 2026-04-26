import { useState, useEffect } from "react";
import { toast } from "sonner";
import { DollarSign } from "lucide-react";
import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
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
import { BudgetSourcesDialogs } from "./budget-sources-dialogs";
import { budgetSourceApi, type BudgetSource } from "@/lib/api";

export function BudgetSources() {
  const [items, setItems] = useState<BudgetSource[]>([]);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<BudgetSource | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    try {
      const res = await budgetSourceApi.getAll();
      setItems(res.data);
    } catch {
      toast.error("Failed to fetch budget sources");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleEdit = (item: BudgetSource) => {
    setEditItem(item);
    setOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await budgetSourceApi.delete(deleteId);
      setItems((prev) => prev.filter((i) => i.id !== deleteId));
      toast.success("Budget source deleted");
    } catch {
      toast.error("Failed to delete budget source");
    }
    setDeleteId(null);
  };

  const handleSuccess = () => {
    setEditItem(null);
    fetchItems();
    toast.success(editItem ? "Budget source updated" : "Budget source created");
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
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <MasterDataPage
          title="Budget Sources"
          items={items}
          onAdd={() => setOpen(true)}
          onEdit={handleEdit}
          onDelete={setDeleteId}
          icon={<DollarSign className="h-6 w-6" />}
          description="Manage budget sources (BOS, Hibah, Komite, etc.)"
        />
      </Main>

      <BudgetSourcesDialogs
        open={open}
        onOpenChange={handleOpenChange}
        editItem={editItem}
        onSuccess={handleSuccess}
      />

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Budget Source</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this budget source? This action cannot be undone.
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
