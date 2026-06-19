"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api-client";

interface SchedulePostInput {
  content: string;
  socialAccountIds: string[];
  scheduledAt: string;
  mediaIds?: string[];
  recurrence?: "ONCE" | "DAILY" | "WEEKLY" | "MONTHLY";
  recurrenceEndDate?: string;
}

export function useScheduler() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const schedulePost = async (input: SchedulePostInput) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post("/api/scheduler/schedule", input);
      return response.data.data;
    } catch (err: any) {
      const message = err.response?.data?.error?.message || "Failed to schedule post";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const getScheduledPosts = async (page = 1, limit = 20, status?: string) => {
    try {
      setError(null);
      const query = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (status) query.append("status", status);

      const response = await api.get(`/api/scheduler/scheduled?${query}`);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.error?.message || "Failed to fetch scheduled posts";
      setError(message);
      throw new Error(message);
    }
  };

  const getDrafts = async (page = 1, limit = 20) => {
    try {
      setError(null);
      const response = await api.get(`/api/scheduler/drafts?page=${page}&limit=${limit}`);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.error?.message || "Failed to fetch drafts";
      setError(message);
      throw new Error(message);
    }
  };

  const getQueue = async (hoursAhead = 24) => {
    try {
      setError(null);
      const response = await api.get(`/api/scheduler/queue?hours=${hoursAhead}`);
      return response.data.data;
    } catch (err: any) {
      const message = err.response?.data?.error?.message || "Failed to fetch queue";
      setError(message);
      throw new Error(message);
    }
  };

  const getPostsByDateRange = async (startDate: string, endDate: string, status?: string) => {
    try {
      setError(null);
      const query = new URLSearchParams({ startDate, endDate });
      if (status) query.append("status", status);

      const response = await api.get(`/api/scheduler/calendar?${query}`);
      return response.data.data;
    } catch (err: any) {
      const message = err.response?.data?.error?.message || "Failed to fetch posts";
      setError(message);
      throw new Error(message);
    }
  };

  const getPostsByDate = async (date: string) => {
    try {
      setError(null);
      const response = await api.get(`/api/scheduler/by-date/${date}`);
      return response.data.data;
    } catch (err: any) {
      const message = err.response?.data?.error?.message || "Failed to fetch posts";
      setError(message);
      throw new Error(message);
    }
  };

  const getStats = async () => {
    try {
      setError(null);
      const response = await api.get("/api/scheduler/stats");
      return response.data.data;
    } catch (err: any) {
      const message = err.response?.data?.error?.message || "Failed to fetch stats";
      setError(message);
      throw new Error(message);
    }
  };

  const getBestTimes = async (platform: string) => {
    try {
      setError(null);
      const response = await api.get(`/api/scheduler/best-times/${platform}`);
      return response.data.data.bestTimes;
    } catch (err: any) {
      const message = err.response?.data?.error?.message || "Failed to fetch best times";
      setError(message);
      throw new Error(message);
    }
  };

  const updatePost = async (postId: string, input: Partial<SchedulePostInput>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.put(`/api/scheduler/${postId}`, input);
      return response.data.data;
    } catch (err: any) {
      const message = err.response?.data?.error?.message || "Failed to update post";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const moveToDraft = async (postId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post(`/api/scheduler/${postId}/move-to-draft`);
      return response.data.data;
    } catch (err: any) {
      const message = err.response?.data?.error?.message || "Failed to move to draft";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (postId: string) => {
    try {
      setLoading(true);
      setError(null);
      await api.delete(`/api/scheduler/${postId}`);
      return true;
    } catch (err: any) {
      const message = err.response?.data?.error?.message || "Failed to delete post";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    schedulePost,
    getScheduledPosts,
    getDrafts,
    getQueue,
    getPostsByDateRange,
    getPostsByDate,
    getStats,
    getBestTimes,
    updatePost,
    moveToDraft,
    deletePost,
  };
}
