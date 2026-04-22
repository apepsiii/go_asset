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
import { locationApi, type Location } from "@/lib/api";

interface LocationsDialogsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem: Location | null;
  onSuccess: () => void;
}

export function LocationsDialogs({
  open,
  onOpenChange,
  editItem,
  onSuccess,
}: LocationsDialogsProps) {
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
        await locationApi.update(editItem.id, { name });
      } else {
        await locationApi.create({ name });
      }
      onSuccess();
      onOpenChange(false);
      setName("");
    } catch {
      toast.error("Failed to save location");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editItem ? "Edit Location" : "Add Location"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Lab 1, Lab 2, Ruang Server"
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
