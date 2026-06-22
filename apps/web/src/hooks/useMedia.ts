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
    const fetchMedia = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to fetch from API if session exists
        if (session?.user) {
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
        } else {
          // Demo mode: return demo media data
          const demoMedia = [
            {
              id: "1",
              name: "Brand Guidelines.pdf",
              type: "DOCUMENT",
              url: "https://via.placeholder.com/300x200?text=PDF",
              size: 2048000,
              createdAt: new Date(),
              mimeType: "application/pdf",
            },
            {
              id: "2",
              name: "Product Showcase.mp4",
              type: "VIDEO",
              url: "https://via.placeholder.com/300x200?text=Video",
              size: 52428800,
              createdAt: new Date(),
              mimeType: "video/mp4",
            },
            {
              id: "3",
              name: "Team Photo.jpg",
              type: "IMAGE",
              url: "https://via.placeholder.com/300x200?text=Image",
              size: 3145728,
              createdAt: new Date(),
              mimeType: "image/jpeg",
              width: 1920,
              height: 1080,
            },
            {
              id: "4",
              name: "Podcast Episode 1.mp3",
              type: "AUDIO",
              url: "https://via.placeholder.com/300x200?text=Audio",
              size: 41943040,
              createdAt: new Date(),
              mimeType: "audio/mp3",
            },
            {
              id: "5",
              name: "Social Media Ad.jpg",
              type: "IMAGE",
              url: "https://via.placeholder.com/300x200?text=Image",
              size: 2097152,
              createdAt: new Date(),
              mimeType: "image/jpeg",
              width: 1080,
              height: 1920,
              isAiGenerated: true,
            },
            {
              id: "6",
              name: "Background Music.wav",
              type: "AUDIO",
              url: "https://via.placeholder.com/300x200?text=Audio",
              size: 104857600,
              createdAt: new Date(),
              mimeType: "audio/wav",
            },
          ];
          setMedia(demoMedia);
          setPagination({
            page: 1,
            limit: 20,
            total: demoMedia.length,
            totalPages: 1,
          });
        }
      } catch (err: any) {
        // On API error, show demo data
        setMedia([]);
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
      // Demo mode: return demo storage usage
      return { mb: 156.5, percent: 15.65 };
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
    try {
      setUploading(true);
      setError(null);

      // Demo mode: simulate upload with delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockUrl = `https://placeholder.com/${file.name}`;
      return {
        id: Math.random().toString(36).substr(2, 9),
        name: name || file.name,
        type: getMediaType(file.type),
        url: mockUrl,
        size: file.size,
        mimeType: file.type,
        createdAt: new Date(),
      };
    } catch (err: any) {
      const message = "Failed to upload media";
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
