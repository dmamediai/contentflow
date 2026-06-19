"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api-client";
import type { Team, PaginatedResponse } from "@social-media-saas/types";

interface UseTeamsOptions {
  page?: number;
  limit?: number;
}

export function useTeams(options: UseTeamsOptions = {}) {
  const { data: session } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: options.page || 1,
    limit: options.limit || 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    if (!session?.user) return;

    const fetchTeams = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get("/api/teams", {
          params: {
            page: pagination.page,
            limit: pagination.limit,
          },
        });

        const data = response.data as PaginatedResponse<Team>;
        setTeams(data.data);
        setPagination(data.pagination);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || "Failed to fetch teams");
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [session, pagination.page, pagination.limit]);

  const createTeam = async (teamData: {
    name: string;
    slug?: string;
    description?: string;
  }) => {
    try {
      setError(null);
      const response = await api.post("/api/teams", teamData);
      const newTeam = response.data.data;
      setTeams((prev) => [newTeam, ...prev]);
      return newTeam;
    } catch (err: any) {
      const message = err.response?.data?.error?.message || "Failed to create team";
      setError(message);
      throw new Error(message);
    }
  };

  return {
    teams,
    loading,
    error,
    pagination,
    createTeam,
    setPagination: (newPagination: typeof pagination) => setPagination(newPagination),
  };
}

export function useTeam(teamId: string) {
  const { data: session } = useSession();
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user || !teamId) return;

    const fetchTeam = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get(`/api/teams/${teamId}`);
        setTeam(response.data.data);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || "Failed to fetch team");
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [session, teamId]);

  const updateTeam = async (updates: { name?: string; description?: string }) => {
    try {
      setError(null);
      const response = await api.put(`/api/teams/${teamId}`, updates);
      const updatedTeam = response.data.data;
      setTeam(updatedTeam);
      return updatedTeam;
    } catch (err: any) {
      const message = err.response?.data?.error?.message || "Failed to update team";
      setError(message);
      throw new Error(message);
    }
  };

  return { team, loading, error, updateTeam };
}
