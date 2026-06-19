"use client";

import { create } from "zustand";
import type { Team } from "@/types";

interface TeamContextStore {
  currentTeam: Team | null;
  teams: Team[];
  setCurrentTeam: (team: Team) => void;
  setTeams: (teams: Team[]) => void;
  updateCurrentTeam: (updates: Partial<Team>) => void;
}

export const useTeamContext = create<TeamContextStore>((set) => ({
  currentTeam: null,
  teams: [],
  setCurrentTeam: (team) => set({ currentTeam: team }),
  setTeams: (teams) => set({ teams }),
  updateCurrentTeam: (updates) =>
    set((state) => ({
      currentTeam: state.currentTeam ? { ...state.currentTeam, ...updates } : null,
    })),
}));
