import { useEffect } from "react";
import { useMasterDataStore } from "@/features/master-data/store/master-data-store";
import { categoryApi } from "@/lib/api";

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const setCategories = useMasterDataStore((s) => s.setCategories);

  useEffect(() => {
    categoryApi.getAll().then((res) => {
      setCategories(res.data);
    });
  }, [setCategories]);

  return <>{children}</>;
}
