"use client";

import { useState, useEffect } from "react";
import { useMedia, useUploadMedia } from "@/hooks/useMedia";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Upload,
  Trash2,
  Download,
  Filter,
  Search,
  Image as ImageIcon,
  Music,
  Video,
  FileText,
  HardDrive,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";

export default function MediaLibraryPage() {
  const [activeTab, setActiveTab] = useState<"all" | "images" | "videos" | "audio">(
    "all"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [storageUsage, setStorageUsage] = useState<any>(null);

  const mediaType =
    activeTab === "all"
      ? undefined
      : (activeTab.toUpperCase() as "IMAGE" | "VIDEO" | "AUDIO");

  const { media, loading, deleteMedia, pagination, setPagination, getStorageUsage } =
    useMedia({
      type: mediaType as any,
    });

  const { uploadMedia, uploading } = useUploadMedia();

  // Load storage usage on mount
  useEffect(() => {
    getStorageUsage()
      .then((usage) => setStorageUsage(usage))
      .catch(() => {});
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      try {
        await uploadMedia(file);
        toast.success(`${file.name} uploaded successfully`);
      } catch (error: any) {
        toast.error(error.message || "Upload failed");
      }
    }

    e.currentTarget.value = "";
  };

  const handleDelete = async (mediaId: string, name: string) => {
    if (!confirm(`Delete ${name}?`)) return;

    try {
      await deleteMedia(mediaId);
      toast.success("Media deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete media");
    }
  };

  const tabs = [
    { id: "all", label: "All Media", icon: FileText },
    { id: "images", label: "Images", icon: ImageIcon },
    { id: "videos", label: "Videos", icon: Video },
    { id: "audio", label: "Audio", icon: Music },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Media Library</h1>
          <p className="text-muted-foreground mt-1">
            Manage your images, videos, and audio files
          </p>
        </div>
        <label>
          <Button asChild>
            <span>
              <Upload className="mr-2 h-4 w-4" />
              Upload Media
            </span>
          </Button>
          <input
            type="file"
            multiple
            hidden
            onChange={handleFileUpload}
            disabled={uploading}
            accept="image/*,video/*,audio/*"
          />
        </label>
      </div>

      {/* Storage Info */}
      {storageUsage && (
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <HardDrive className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <div className="flex-1">
                <p className="font-semibold text-sm">Storage Usage</p>
                <p className="text-muted-foreground text-sm">
                  {storageUsage.mb.toFixed(2)} MB / 1,000 MB
                </p>
                <div className="w-full bg-blue-200 dark:bg-blue-900 h-2 rounded-full mt-2">
                  <div
                    className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full"
                    style={{
                      width: `${Math.min((storageUsage.mb / 1000) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search media..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-card rounded-lg border p-4 animate-pulse h-48"
            >
              <div className="h-full bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : media.length === 0 ? (
        <Card>
          <CardContent className="pt-12 text-center pb-12">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No media yet</h3>
            <p className="text-muted-foreground mb-6">
              Upload your first image, video, or audio file to get started
            </p>
            <label>
              <Button asChild>
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Media
                </span>
              </Button>
              <input
                type="file"
                multiple
                hidden
                onChange={handleFileUpload}
                disabled={uploading}
                accept="image/*,video/*,audio/*"
              />
            </label>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {media.map((item) => (
            <MediaCard
              key={item.id}
              media={item}
              onDelete={() => handleDelete(item.id, item.name)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && media.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={pagination.page === 1}
              onClick={() =>
                setPagination({
                  ...pagination,
                  page: Math.max(1, pagination.page - 1),
                })
              }
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={pagination.page === pagination.totalPages}
              onClick={() =>
                setPagination({
                  ...pagination,
                  page: Math.min(pagination.totalPages, pagination.page + 1),
                })
              }
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function MediaCard({ media, onDelete }: { media: any; onDelete: () => void }) {
  const getIcon = (type: string) => {
    switch (type) {
      case "IMAGE":
        return <ImageIcon className="w-6 h-6" />;
      case "VIDEO":
        return <Video className="w-6 h-6" />;
      case "AUDIO":
        return <Music className="w-6 h-6" />;
      default:
        return <FileText className="w-6 h-6" />;
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      {/* Thumbnail */}
      <div className="relative h-40 bg-muted flex items-center justify-center overflow-hidden">
        {media.type === "IMAGE" && media.url ? (
          <img
            src={media.url}
            alt={media.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="text-muted-foreground">{getIcon(media.type)}</div>
        )}

        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          {media.url && (
            <a href={media.url} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="secondary">
                <Download className="w-4 h-4" />
              </Button>
            </a>
          )}
          <Button
            size="sm"
            variant="destructive"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Info */}
      <CardContent className="p-4">
        <h3 className="font-semibold text-sm truncate">{media.name}</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {(media.size / 1024 / 1024).toFixed(2)} MB
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date(media.createdAt).toLocaleDateString()}
        </p>

        {media.width && media.height && (
          <p className="text-xs text-muted-foreground mt-1">
            {media.width} × {media.height}
          </p>
        )}

        {media.isAiGenerated && (
          <div className="mt-2 px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded text-xs font-semibold">
            AI Generated
          </div>
        )}
      </CardContent>
    </Card>
  );
}
