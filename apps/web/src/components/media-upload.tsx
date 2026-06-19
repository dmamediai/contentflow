"use client";

import { useState, useRef } from "react";
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useUploadMedia } from "@/hooks/useMedia";

interface MediaUploadProps {
  onSuccess?: (media: any) => void;
  maxFiles?: number;
  accept?: string;
}

export function MediaUpload({
  onSuccess,
  maxFiles = 5,
  accept = "image/*,video/*,audio/*",
}: MediaUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadMedia, uploading } = useUploadMedia();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.currentTarget.files || []);
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter((file) => {
      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 50MB limit`);
        return false;
      }
      return true;
    });

    const totalFiles = files.length + validFiles.length;
    if (totalFiles > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadAll = async () => {
    if (files.length === 0) return;

    let successCount = 0;
    for (const file of files) {
      try {
        const media = await uploadMedia(file);
        onSuccess?.(media);
        successCount++;
      } catch (error: any) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} file(s) uploaded successfully`);
      setFiles([]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground hover:border-primary"
        }`}
      >
        <div className="text-center">
          <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
          <h3 className="font-semibold mb-1">Drop files here or click to upload</h3>
          <p className="text-sm text-muted-foreground">
            Images, videos, and audio up to 50MB each ({maxFiles} max)
          </p>

          <Button
            className="mt-4"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            Select Files
          </Button>

          <input
            ref={inputRef}
            type="file"
            multiple
            hidden
            onChange={handleChange}
            accept={accept}
            disabled={uploading}
          />
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">
            Selected Files ({files.length}/{maxFiles})
          </h4>

          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                disabled={uploading}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}

          {/* Upload Button */}
          <Button
            onClick={handleUploadAll}
            disabled={uploading || files.length === 0}
            className="w-full"
          >
            {uploading ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload {files.length} File{files.length !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
