import { useState } from "react";
import { useMasterDataStore } from "@/features/master-data/store/master-data-store";
import { categoryApi, type Category } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CategoriesDialogsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editCategory: Category | null;
  onSuccess: () => void;
}

export function CategoriesDialogs({
  open,
  onOpenChange,
  editCategory,
  onSuccess,
}: CategoriesDialogsProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { addCategory, updateCategory } = useMasterDataStore();

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (editCategory) {
        await categoryApi.update(editCategory.id, { name });
        updateCategory(editCategory.id, { name });
      } else {
        const res = await categoryApi.create({ name });
        addCategory(res.data);
      }
      onSuccess();
      onOpenChange(false);
      setName("");
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editCategory ? "Edit Category" : "Add Category"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Laptop, PC Desktop, Switch"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !name}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
