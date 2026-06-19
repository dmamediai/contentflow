import prisma from "../lib/db";
import { ApiError, ErrorCodes, MediaType } from "@social-media-saas/types";
import { v4 as uuidv4 } from "uuid";

export interface UploadMediaData {
  teamId: string;
  name: string;
  type: MediaType;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
  duration?: number;
  url: string;
  isAiGenerated?: boolean;
  aiModel?: string;
  aiPrompt?: string;
}

export class MediaService {
  /**
   * Create media record in database
   */
  static async createMedia(data: UploadMediaData) {
    // Validate team exists
    const team = await prisma.team.findUnique({
      where: { id: data.teamId },
    });

    if (!team) {
      throw new ApiError(ErrorCodes.NOT_FOUND, "Team not found", 404);
    }

    // Generate storage key
    const storageKey = this.generateStorageKey(data.teamId, data.name);

    // Create media record
    const media = await prisma.media.create({
      data: {
        teamId: data.teamId,
        name: data.name,
        type: data.type,
        url: data.url,
        publicUrl: data.url, // In production, this would be the CDN URL
        size: data.size,
        width: data.width,
        height: data.height,
        duration: data.duration,
        mimeType: data.mimeType,
        storageKey,
        isAiGenerated: data.isAiGenerated || false,
        aiModel: data.aiModel,
        aiPrompt: data.aiPrompt,
      },
    });

    return media;
  }

  /**
   * Get all media for a team
   */
  static async getTeamMedia(
    teamId: string,
    type?: MediaType,
    page = 1,
    limit = 20
  ) {
    const where: any = { teamId };
    if (type) {
      where.type = type;
    }

    const media = await prisma.media.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.media.count({ where });

    return {
      data: media,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single media by ID
   */
  static async getMediaById(mediaId: string, teamId: string) {
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!media || media.teamId !== teamId) {
      throw new ApiError(ErrorCodes.NOT_FOUND, "Media not found", 404);
    }

    return media;
  }

  /**
   * Update media metadata
   */
  static async updateMedia(
    mediaId: string,
    teamId: string,
    updates: { name?: string }
  ) {
    const media = await this.getMediaById(mediaId, teamId);

    const updated = await prisma.media.update({
      where: { id: mediaId },
      data: updates,
    });

    return updated;
  }

  /**
   * Delete media
   */
  static async deleteMedia(mediaId: string, teamId: string) {
    const media = await this.getMediaById(mediaId, teamId);

    // Delete from database
    await prisma.media.delete({ where: { id: mediaId } });

    // In production, also delete from storage
    // await supabase.storage.from("media").remove([media.storageKey]);

    return { message: "Media deleted successfully" };
  }

  /**
   * Get media storage usage for team
   */
  static async getTeamStorageUsage(teamId: string) {
    const result = await prisma.media.aggregate({
      where: { teamId },
      _sum: { size: true },
    });

    const totalBytes = result._sum.size || 0;
    const totalMB = totalBytes / (1024 * 1024);

    return {
      bytes: totalBytes,
      mb: Math.round(totalMB * 100) / 100,
      gb: Math.round((totalMB / 1024) * 100) / 100,
    };
  }

  /**
   * Get media by type for team
   */
  static async getMediaByType(teamId: string, type: MediaType) {
    const media = await prisma.media.findMany({
      where: { teamId, type },
      orderBy: { createdAt: "desc" },
    });

    return media;
  }

  /**
   * Search media by name
   */
  static async searchMedia(teamId: string, query: string, limit = 10) {
    const media = await prisma.media.findMany({
      where: {
        teamId,
        name: {
          contains: query,
          mode: "insensitive",
        },
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    return media;
  }

  /**
   * Get AI-generated media
   */
  static async getAiGeneratedMedia(teamId: string, page = 1, limit = 20) {
    const media = await prisma.media.findMany({
      where: { teamId, isAiGenerated: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.media.count({
      where: { teamId, isAiGenerated: true },
    });

    return {
      data: media,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Generate storage key for media
   */
  static generateStorageKey(teamId: string, fileName: string): string {
    const timestamp = Date.now();
    const randomId = uuidv4().split("-")[0];
    const cleanName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    return `${teamId}/${timestamp}-${randomId}-${cleanName}`;
  }

  /**
   * Get file type from mime type
   */
  static getMediaType(mimeType: string): MediaType {
    if (mimeType.startsWith("image/")) return "IMAGE";
    if (mimeType.startsWith("video/")) return "VIDEO";
    if (mimeType.startsWith("audio/")) return "AUDIO";
    return "OTHER";
  }

  /**
   * Validate file size (max 50MB)
   */
  static validateFileSize(sizeInBytes: number): boolean {
    const maxSizeBytes = 50 * 1024 * 1024; // 50MB
    return sizeInBytes <= maxSizeBytes;
  }

  /**
   * Get allowed mime types
   */
  static getAllowedMimeTypes(): string[] {
    return [
      // Images
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      // Videos
      "video/mp4",
      "video/quicktime",
      "video/x-msvideo",
      "video/x-matroska",
      // Audio
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "audio/aac",
    ];
  }
}
