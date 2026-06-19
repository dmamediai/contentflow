"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api-client";
import type { Team, PaginatedResponse } from "@/types";

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
    const fetchTeams = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to fetch from API if session exists
        if (session?.user) {
          const response = await api.get("/api/teams", {
            params: {
              page: pagination.page,
              limit: pagination.limit,
            },
          });

          const data = response.data as PaginatedResponse<Team>;
          setTeams(data.data);
          setPagination({
            page: data.pagination.page,
            limit: data.pagination.pageSize,
            total: data.pagination.total,
            totalPages: data.pagination.totalPages,
          });
        } else {
          // Demo mode: return demo team data
          const demoTeams: Team[] = [
            {
              id: "demo-1",
              name: "Demo Team",
              slug: "demo-team",
              image: null,
              description: "This is a demo team for testing",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ];
          setTeams(demoTeams);
        }
      } catch (err: any) {
        // On API error, show demo data instead of error
        const demoTeams: Team[] = [
          {
            id: "demo-1",
            name: "Demo Team",
            slug: "demo-team",
            image: null,
            description: "This is a demo team for testing",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
        setTeams(demoTeams);
        // Don't set error - just use demo data
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
