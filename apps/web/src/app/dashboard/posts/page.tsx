"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Upload,
  ChevronDown,
  Link2,
  LayoutGrid,
  List,
  Calendar,
  Loader2,
} from "lucide-react";

interface Account {
  id: string;
  profileId: string;
  platform: string;
  displayName: string;
}

interface Post {
  id: string;
  content: string;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  socialAccounts: { platform: string; displayName: string }[];
}

const STATUS_COLORS: Record<string, "outline" | "success" | "destructive" | "secondary"> = {
  DRAFT: "secondary",
  SCHEDULED: "outline",
  PUBLISHED: "success",
  FAILED: "destructive",
  ARCHIVED: "secondary",
};

export default function PostsOverviewPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | "all">("all");
  const [platformFilter, setPlatformFilter] = useState<string | "all">("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [view, setView] = useState<"list" | "grid">("list");

  const [createOpen, setCreateOpen] = useState(false);
  const [content, setContent] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [accountsRes, postsRes] = await Promise.all([
        api.get("/api/oauth/accounts"),
        api.get("/api/scheduler/scheduled", {
          params: { limit: 100, ...(statusFilter !== "all" && { status: statusFilter }) },
        }),
      ]);
      setAccounts(accountsRes.data.data);
      setPosts(postsRes.data.data);
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredPosts = posts
    .filter((p) => platformFilter === "all" || p.socialAccounts.some((a) => a.platform === platformFilter))
    .sort((a, b) => {
      const aTime = new Date(a.scheduledAt || a.createdAt).getTime();
      const bTime = new Date(b.scheduledAt || b.createdAt).getTime();
      return sort === "newest" ? bTime - aTime : aTime - bTime;
    });

  const toggleAccount = (id: string) => {
    setSelectedAccountIds((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  };

  const handleCreate = async () => {
    if (!content.trim() || !scheduledAt || selectedAccountIds.length === 0) return;
    setCreating(true);
    try {
      await api.post("/api/scheduler/schedule", {
        content,
        socialAccountIds: selectedAccountIds,
        scheduledAt: new Date(scheduledAt).toISOString(),
      });
      toast.success("Post scheduled");
      setCreateOpen(false);
      setContent("");
      setScheduledAt("");
      setSelectedAccountIds([]);
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || "Failed to schedule post");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Posts</h1>
          <p className="text-muted-foreground mt-1">Manage your scheduled and published content</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button onClick={() => setCreateOpen(true)} className="gap-2" disabled={accounts.length === 0}>
            <Plus size={16} />
            Create post
          </Button>
          <Button variant="outline" onClick={() => toast.info("CSV import coming soon")} className="gap-2">
            <Upload size={16} />
            Import CSV
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                {statusFilter === "all" ? "All posts" : statusFilter}
                <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setStatusFilter("all")}>All posts</DropdownMenuItem>
              {["DRAFT", "SCHEDULED", "PUBLISHED", "FAILED", "ARCHIVED"].map((s) => (
                <DropdownMenuItem key={s} onClick={() => setStatusFilter(s)}>
                  {s}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                {platformFilter === "all" ? "All platforms" : platformFilter}
                <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setPlatformFilter("all")}>All platforms</DropdownMenuItem>
              {Array.from(new Set(accounts.map((a) => a.platform))).map((p) => (
                <DropdownMenuItem key={p} onClick={() => setPlatformFilter(p)}>
                  {p}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                {sort === "newest" ? "Scheduled (new)" : "Scheduled (old)"}
                <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSort("newest")}>Scheduled (new)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSort("oldest")}>Scheduled (old)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center border rounded-md">
            <button
              onClick={() => setView("grid")}
              className={`p-2 rounded-l-md ${view === "grid" ? "bg-muted" : "hover:bg-muted"}`}
              aria-label="Grid view"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-2 border-l ${view === "list" ? "bg-muted" : "hover:bg-muted"}`}
              aria-label="List view"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => toast.info("Calendar view coming soon")}
              className="p-2 rounded-r-md border-l hover:bg-muted"
              aria-label="Calendar view"
            >
              <Calendar size={16} />
            </button>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="py-20 text-center">
            <Link2 className="w-8 h-8 mx-auto text-muted-foreground mb-4" />
            <p className="font-semibold">No accounts connected</p>
            <p className="text-sm text-muted-foreground mt-1 mb-6">
              Connect a platform in the Connections tab to start scheduling posts.
            </p>
            <Link href="/dashboard/connections">
              <Button>Go to Connections</Button>
            </Link>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground mb-4">No posts yet.</p>
            <Button variant="outline" onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus size={16} />
              Create your first post
            </Button>
          </div>
        ) : view === "list" ? (
          <div className="divide-y">
            {filteredPosts.map((post) => (
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
                <div className="text-right shrink-0">
                  <Badge variant={STATUS_COLORS[post.status] || "outline"}>{post.status}</Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : "-"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="p-4 space-y-2">
                <Badge variant={STATUS_COLORS[post.status] || "outline"}>{post.status}</Badge>
                <p className="text-sm line-clamp-3">{post.content}</p>
                <div className="flex gap-1.5 flex-wrap">
                  {post.socialAccounts.map((a, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {a.platform}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : "-"}
                </p>
              </Card>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create post</DialogTitle>
            <DialogDescription>Schedule content across your connected accounts.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <textarea
              placeholder="Write your post..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border rounded-md bg-background text-sm"
            />
            <div>
              <p className="text-sm font-medium mb-2">Accounts</p>
              <div className="flex flex-wrap gap-2">
                {accounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => toggleAccount(account.id)}
                    className={`px-3 py-1.5 rounded-full text-sm border ${
                      selectedAccountIds.includes(account.id)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    {account.platform} - {account.displayName}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Scheduled for</p>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleCreate}
              disabled={!content.trim() || !scheduledAt || selectedAccountIds.length === 0 || creating}
            >
              {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Schedule post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
