import { Pencil, Trash2 } from "lucide-react";
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
import { useMasterDataStore } from "@/features/master-data/store/master-data-store";
import type { Category } from "@/lib/api";

interface CategoriesTableProps {
  onEdit: (category: Category) => void;
  onDelete: (id: number) => void;
}

export function CategoriesTable({
  onEdit,
  onDelete,
}: CategoriesTableProps) {
  const categories = useMasterDataStore((s) => s.categories);

  return (
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
          {categories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center">
                No categories found
              </TableCell>
            </TableRow>
          ) : (
            categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>{category.id}</TableCell>
                <TableCell>
                  <Badge variant="outline">{category.name}</Badge>
                </TableCell>
                <TableCell>
                  {new Date(category.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(category)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(category.id)}
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
  );
}
