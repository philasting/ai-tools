"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFavorites } from "./use-favorites";

/**
 * Global keyboard shortcuts hook.
 * Alt+H — Go to homepage
 * Alt+F — Toggle favorite on current tool (when on a tool detail page)
 * Alt+K — Focus search (handled in ToolSearch component)
 */
export function useKeyboardShortcuts(currentToolSlug?: string) {
  const router = useRouter();
  const { toggleFavorite } = useFavorites();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+H: Go to homepage
      if (e.altKey && e.key === "h") {
        e.preventDefault();
        router.push("/");
      }

      // Alt+F: Toggle favorite for current tool
      if (e.altKey && e.key === "f") {
        e.preventDefault();
        if (currentToolSlug) {
          toggleFavorite(currentToolSlug);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [router, toggleFavorite, currentToolSlug]);
}
