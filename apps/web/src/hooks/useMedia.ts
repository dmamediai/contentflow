"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api-client";
import type { Media, PaginatedResponse } from "@/types";

interface UseMediaOptions {
  page?: number;
  limit?: number;
  type?: "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT" | "OTHER";
}

export function useMedia(options: UseMediaOptions = {}) {
  const { data: session } = useSession();
  const [media, setMedia] = useState<Media[]>([]);
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

    const fetchMedia = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
        });

        if (options.type) {
          params.append("type", options.type);
        }

        const response = await api.get(`/api/media?${params}`);
        const data = response.data as PaginatedResponse<Media>;

        setMedia(data.data);
        setPagination({
          page: data.pagination.page,
          limit: data.pagination.pageSize,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        });
      } catch (err: any) {
        setError(err.response?.data?.error?.message || "Failed to fetch media");
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, [session, pagination.page, options.type]);

  const deleteMedia = async (mediaId: string) => {
    try {
      setError(null);
      await api.delete(`/api/media/${mediaId}`);
      setMedia((prev) => prev.filter((m) => m.id !== mediaId));
      return true;
    } catch (err: any) {
      const message = err.response?.data?.error?.message || "Failed to delete media";
      setError(message);
      throw new Error(message);
    }
  };

  const getStorageUsage = async () => {
    try {
      const response = await api.get("/api/media/storage-usage");
      return response.data.data;
    } catch (err: any) {
      throw new Error("Failed to get storage usage");
    }
  };

  return {
    media,
    loading,
    error,
    pagination,
    deleteMedia,
    getStorageUsage,
    setPagination: (newPagination: typeof pagination) => setPagination(newPagination),
  };
}

export function useUploadMedia() {
  const { data: session } = useSession();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadMedia = async (file: File, name?: string) => {
    if (!session?.user) {
      throw new Error("Not authenticated");
    }

    try {
      setUploading(true);
      setError(null);

      // In production, upload to Supabase Storage first
      // For now, create media record with a placeholder URL
      const formData = new FormData();
      formData.append("file", file);

      // Mock upload - replace with actual Supabase storage call
      const mockUrl = `https://placeholder.com/${file.name}`;

      const response = await api.post("/api/media", {
        name: name || file.name,
        type: getMediaType(file.type),
        url: mockUrl,
        size: file.size,
        mimeType: file.type,
      });

      return response.data.data;
    } catch (err: any) {
      const message = err.response?.data?.error?.message || "Failed to upload media";
      setError(message);
      throw new Error(message);
    } finally {
      setUploading(false);
    }
  };

  return { uploadMedia, uploading, error };
}

function getMediaType(mimeType: string) {
  if (mimeType.startsWith("image/")) return "IMAGE";
  if (mimeType.startsWith("video/")) return "VIDEO";
  if (mimeType.startsWith("audio/")) return "AUDIO";
  return "OTHER";
}
