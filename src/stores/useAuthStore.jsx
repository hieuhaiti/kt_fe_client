import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getProfile, logout as apiLogout } from "@/services/authService";
import { tokenManager } from "@/lib/tokenManager";

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      setUser: (user) => set({ user, isAuthenticated: !!user, error: null }),
      clearUser: () => set({ user: null, isAuthenticated: false, error: null }),
      expireSession: () => {
        tokenManager.clearTokens();
        set({ user: null, isAuthenticated: false, loading: false, error: null });
      },

      fetchProfile: async () => {
        if (get().loading) return null;
        set({ loading: true, error: null });
        try {
          const profile = await getProfile();
          const user = profile?.data?.user ?? profile?.user ?? profile ?? null;
          set({ user, isAuthenticated: !!user, loading: false });
          return user;
        } catch (err) {
          set({
            error: err?.message || "Failed to fetch profile",
            loading: false,
            user: null,
            isAuthenticated: false,
          });
          return null;
        }
      },

      logout: async () => {
        set({ loading: true, error: null });
        try {
          await apiLogout();
        } catch (err) {
          console.warn("logout API failed", err);
        }
        set({
          user: null,
          isAuthenticated: false,
          loading: false,
          error: null,
        });
      },
    }),
    {
      name: "auth-storage",
      version: 1,
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

export default useAuthStore;
