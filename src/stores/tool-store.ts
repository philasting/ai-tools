import { create } from "zustand";
import type { Category } from "@/types/tool";

interface ToolStoreState {
  /** Current active category filter (null = all) */
  activeCategory: Category | null;
  /** Sidebar open state (for mobile) */
  sidebarOpen: boolean;
  /** Search query */
  searchQuery: string;

  setActiveCategory: (category: Category | null) => void;
  setSidebarOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
}

export const useToolStore = create<ToolStoreState>((set) => ({
  activeCategory: null,
  sidebarOpen: false,
  searchQuery: "",

  setActiveCategory: (category) => set({ activeCategory: category }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
