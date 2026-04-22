import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CategoriesPrimaryButtonsProps {
  onClick: () => void;
}

export function CategoriesPrimaryButtons({ onClick }: CategoriesPrimaryButtonsProps) {
  return (
    <Button onClick={onClick}>
      <Plus className="mr-2 h-4 w-4" />
      Add Category
    </Button>
  );
}
