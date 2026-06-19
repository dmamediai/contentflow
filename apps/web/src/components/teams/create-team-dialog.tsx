"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required").max(100),
  slug: z.string().optional(),
  description: z.string().max(500).optional(),
});

type CreateTeamFormData = z.infer<typeof createTeamSchema>;

interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTeam: (data: CreateTeamFormData) => Promise<void>;
}

export function CreateTeamDialog({
  open,
  onOpenChange,
  onCreateTeam,
}: CreateTeamDialogProps) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<CreateTeamFormData>({
    resolver: zodResolver(createTeamSchema),
  });

  const onSubmit = async (data: CreateTeamFormData) => {
    try {
      setLoading(true);
      await onCreateTeam(data);
      reset();
      toast.success("Team created successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to create team");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
        <h2 className="text-2xl font-bold mb-4">Create Team</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Team Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Team Name</label>
            <input
              {...register("name")}
              type="text"
              className="w-full px-3 py-2 border rounded-md bg-background"
              placeholder="My Awesome Team"
              disabled={loading}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description (Optional)</label>
            <textarea
              {...register("description")}
              className="w-full px-3 py-2 border rounded-md bg-background"
              placeholder="What's this team about?"
              rows={3}
              disabled={loading}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Creating..." : "Create Team"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
