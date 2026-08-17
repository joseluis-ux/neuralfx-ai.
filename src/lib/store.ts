"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GeneratedEA, BotProfile } from "@/types";

export interface SavedStrategy {
  id: string;
  name: string;
  code: string;
  filename: string;
  mqlVersion: "MQL4" | "MQL5";
  profile: BotProfile | null;
  features: string[];
  warnings: string[];
  prompt?: string;
  createdAt: string;
}

interface StrategyStore {
  strategies: SavedStrategy[];
  addStrategy: (s: Omit<SavedStrategy, "id" | "createdAt">) => string;
  removeStrategy: (id: string) => void;
  clearAll: () => void;
  getById: (id: string) => SavedStrategy | undefined;
}

export const useStrategyStore = create<StrategyStore>()(
  persist(
    (set, get) => ({
      strategies: [],

      addStrategy: (s) => {
        const id = `strat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const entry: SavedStrategy = {
          ...s,
          id,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          strategies: [entry, ...state.strategies].slice(0, 50), // máx 50
        }));
        return id;
      },

      removeStrategy: (id) =>
        set((state) => ({
          strategies: state.strategies.filter((x) => x.id !== id),
        })),

      clearAll: () => set({ strategies: [] }),

      getById: (id) => get().strategies.find((x) => x.id === id),
    }),
    {
      name: "neuralfx-strategies-v2",
    }
  )
);
