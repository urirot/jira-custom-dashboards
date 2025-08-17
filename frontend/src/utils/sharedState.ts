import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FilterState {
  selectedEpic: { key: string; name: string } | null;
  selectedTeam: { key: string; name: string } | null;
  setSelectedEpic: (epic: { key: string; name: string } | null) => void;
  setSelectedTeam: (team: { key: string; name: string } | null) => void;
  clearFilters: () => void;
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      selectedEpic: null,
      selectedTeam: null,
      setSelectedEpic: (epic) => set({ selectedEpic: epic }),
      setSelectedTeam: (team) => set({ selectedTeam: team }),
      clearFilters: () => set({ selectedEpic: null, selectedTeam: null }),
    }),
    {
      name: 'jira-filter-store',
      partialize: (state) => ({ 
        selectedEpic: state.selectedEpic,
        selectedTeam: state.selectedTeam
      }),
    }
  )
);
