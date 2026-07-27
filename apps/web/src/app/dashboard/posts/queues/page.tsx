"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Layers, Loader2 } from "lucide-react";

interface QueuedPost {
  id: string;
  content: string;
  status: string;
  scheduledAt: string | null;
  socialAccounts: { platform: string; displayName: string }[];
}

export default function QueuesPage() {
  const [posts, setPosts] = useState<QueuedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoursAhead, setHoursAhead] = useState(24);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/scheduler/queue", { params: { hours: hoursAhead } });
      setPosts(data.data);
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || "Failed to load queue");
    } finally {
      setLoading(false);
    }
  }, [hoursAhead]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Queues</h1>
          <p className="text-muted-foreground mt-1">Posts scheduled to publish soon</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 border rounded-md px-3 py-2 text-sm hover:bg-muted">
              Next {hoursAhead}h
              <ChevronDown size={14} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {[6, 24, 72, 168].map((h) => (
              <DropdownMenuItem key={h} onClick={() => setHoursAhead(h)}>
                Next {h}h
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center">
            <Layers className="w-8 h-8 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nothing queued in the next {hoursAhead} hours.</p>
          </div>
        ) : (
          <div className="divide-y">
            {posts.map((post) => (
              <div key={post.id} className="flex items-center justify-between px-6 py-4 gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate">{post.content}</p>
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    {post.socialAccounts.map((a, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {a.platform}
                      </Badge>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground shrink-0">
                  {post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : "-"}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
