import { create } from "zustand";

interface ExampleState {
  count: number;
  increment: () => void;
  decrement: () => void;
}

export const useExampleStore = create<ExampleState>((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
  decrement: () => set((s) => ({ count: s.count - 1 })),
}));
