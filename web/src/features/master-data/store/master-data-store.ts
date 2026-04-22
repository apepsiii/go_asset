import { create } from "zustand";
import type { Category } from "@/lib/api";

interface MasterDataState {
  categories: Category[];
  setCategories: (categories: Category[]) => void;
  addCategory: (category: Category) => void;
  updateCategory: (id: number, data: { name: string }) => void;
  deleteCategory: (id: number) => void;
}

export const useMasterDataStore = create<MasterDataState>((set) => ({
  categories: [],
  setCategories: (categories) => set({ categories }),
  addCategory: (category) =>
    set((state) => ({ categories: [...state.categories, category] })),
  updateCategory: (id, data) =>
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === id ? { ...c, ...data } : c
      ),
    })),
  deleteCategory: (id) =>
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    })),
}));
