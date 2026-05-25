"use client";

import { useLocalStorage } from "./use-local-storage";

/**
 * Hook for managing favorite tools.
 * Stores favorite tool slugs in localStorage.
 */
export function useFavorites() {
  const [favorites, setFavorites] = useLocalStorage<string[]>(
    "toolbox-favorites",
    []
  );

  const isFavorite = (slug: string): boolean => {
    return favorites.includes(slug);
  };

  const toggleFavorite = (slug: string) => {
    setFavorites((prev) => {
      if (prev.includes(slug)) {
        return prev.filter((s) => s !== slug);
      }
      return [...prev, slug];
    });
  };

  const addFavorite = (slug: string) => {
    setFavorites((prev) => {
      if (prev.includes(slug)) return prev;
      return [...prev, slug];
    });
  };

  const removeFavorite = (slug: string) => {
    setFavorites((prev) => prev.filter((s) => s !== slug));
  };

  return { favorites, isFavorite, toggleFavorite, addFavorite, removeFavorite };
}
