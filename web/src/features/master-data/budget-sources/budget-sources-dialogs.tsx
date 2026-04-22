import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { budgetSourceApi, type BudgetSource } from "@/lib/api";

interface BudgetSourcesDialogsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem: BudgetSource | null;
  onSuccess: () => void;
}

export function BudgetSourcesDialogs({
  open,
  onOpenChange,
  editItem,
  onSuccess,
}: BudgetSourcesDialogsProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
    } else {
      setName("");
    }
  }, [editItem]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (editItem) {
        await budgetSourceApi.update(editItem.id, { name });
      } else {
        await budgetSourceApi.create({ name });
      }
      onSuccess();
      onOpenChange(false);
      setName("");
    } catch {
      toast.error("Failed to save budget source");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editItem ? "Edit Budget Source" : "Add Budget Source"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., BOS Reguler, BOS Kinerja, Hibah Industri"
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
