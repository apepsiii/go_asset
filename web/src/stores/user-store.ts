import { create } from "zustand";
import { userApi, type CurrentUser } from "@/lib/api";

interface UserState {
  user: CurrentUser | null;
  loading: boolean;
  setUser: (user: CurrentUser | null) => void;
  fetchUser: () => Promise<void>;
  isAdmin: () => boolean;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  loading: false,

  setUser: (user) => set({ user }),

  fetchUser: async () => {
    set({ loading: true });
    try {
      const res = await userApi.getCurrentUser();
      set({ user: res.data, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },

  isAdmin: () => {
    const { user } = get();
    return user?.role === "admin";
  },
}));
