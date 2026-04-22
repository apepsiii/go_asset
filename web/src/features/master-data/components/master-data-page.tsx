import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MasterDataItem {
  id: number;
  name: string;
  created_at: string;
}

interface MasterDataPageProps {
  title: string;
  items: MasterDataItem[];
  onAdd: () => void;
  onEdit: (item: MasterDataItem) => void;
  onDelete: (id: number) => void;
  icon: React.ReactNode;
  description: string;
}

export function MasterDataPage({
  title,
  items,
  onAdd,
  onEdit,
  onDelete,
  icon,
  description,
}: MasterDataPageProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            {icon} {title}
          </h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <Button onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add {title}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No {title.toLowerCase()} found
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.name}</Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(item.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(item.id)}
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
    </div>
  );
}
