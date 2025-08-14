import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FilterState {
  projects: { key: string; name: string }[];
  selectedProject: { key: string; name: string } | null;
  selectedEpic: { key: string; name: string } | null;
  selectedTeam: { key: string; name: string } | null;
  loadingProjects: boolean;
  setProjects: (projects: { key: string; name: string }[]) => void;
  setSelectedProject: (project: { key: string; name: string } | null) => void;
  setSelectedEpic: (epic: { key: string; name: string } | null) => void;
  setSelectedTeam: (team: { key: string; name: string } | null) => void;
  setLoadingProjects: (loading: boolean) => void;
  clearFilters: () => void;
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      projects: [],
      selectedProject: null,
      selectedEpic: null,
      selectedTeam: null,
      loadingProjects: false,
      setProjects: (projects) => set({ projects }),
      setSelectedProject: (project) => {
        console.log("setSelectedProject called with:", project?.key);
        set({ selectedProject: project });
      },
      setSelectedEpic: (epic) => set({ selectedEpic: epic }),
      setSelectedTeam: (team) => set({ selectedTeam: team }),
      setLoadingProjects: (loading) => set({ loadingProjects: loading }),
      clearFilters: () => set({ selectedProject: null, selectedEpic: null, selectedTeam: null }),
    }),
    {
      name: 'jira-filter-store',
      partialize: (state) => ({ 
        projects: state.projects,
        selectedProject: state.selectedProject,
        selectedEpic: state.selectedEpic,
        selectedTeam: state.selectedTeam
      }),
    }
  )
);
