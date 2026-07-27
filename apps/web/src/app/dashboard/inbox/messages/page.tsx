"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, ChevronDown, PenSquare, MessageSquare, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  profileId: string;
  platform: string;
  externalContactId: string;
  externalContactName: string | null;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  socialAccount: { id: string; platform: string; displayName: string; username: string };
}

interface Profile {
  id: string;
  name: string;
}

interface Account {
  id: string;
  platform: string;
  displayName: string;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  const [platformFilter, setPlatformFilter] = useState<string | "all">("all");
  const [profileFilter, setProfileFilter] = useState<string | "all">("all");
  const [accountFilter, setAccountFilter] = useState<string | "all">("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [conversationsRes, profilesRes, accountsRes] = await Promise.all([
        api.get("/api/inbox/conversations", {
          params: {
            ...(platformFilter !== "all" && { platform: platformFilter }),
            ...(profileFilter !== "all" && { profileId: profileFilter }),
            ...(accountFilter !== "all" && { accountId: accountFilter }),
          },
        }),
        api.get("/api/profiles"),
        api.get("/api/oauth/accounts"),
      ]);
      setConversations(conversationsRes.data.data);
      setProfiles(profilesRes.data.data);
      setAccounts(accountsRes.data.data);
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }, [platformFilter, profileFilter, accountFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = conversations
    .filter((c) => {
      if (!search) return true;
      const haystack = `${c.externalContactName || ""} ${c.externalContactId} ${c.lastMessagePreview || ""}`.toLowerCase();
      return haystack.includes(search.toLowerCase());
    })
    .sort((a, b) => {
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return sort === "newest" ? bTime - aTime : aTime - bTime;
    });

  const selected = conversations.find((c) => c.id === selectedId);

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-8 border-t">
      {/* Conversation list */}
      <div className="w-[380px] shrink-0 border-r flex flex-col">
        <div className="p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Messages</h1>
          <Button variant="ghost" size="icon">
            <PenSquare size={18} />
          </Button>
        </div>

        <div className="px-4 flex items-center gap-2 flex-wrap pb-3">
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                {profileFilter === "all" ? "All profiles" : profiles.find((p) => p.id === profileFilter)?.name}
                <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setProfileFilter("all")}>All profiles</DropdownMenuItem>
              {profiles.map((p) => (
                <DropdownMenuItem key={p.id} onClick={() => setProfileFilter(p.id)}>
                  {p.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                {accountFilter === "all" ? "All accounts" : accounts.find((a) => a.id === accountFilter)?.displayName}
                <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setAccountFilter("all")}>All accounts</DropdownMenuItem>
              {accounts.map((a) => (
                <DropdownMenuItem key={a.id} onClick={() => setAccountFilter(a.id)}>
                  {a.displayName}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Search messages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="px-4 py-2 flex items-center justify-between border-t">
          <span className="text-sm font-medium">Conversations</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                {sort === "newest" ? "Newest first" : "Oldest first"}
                <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSort("newest")}>Newest first</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSort("oldest")}>Oldest first</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center px-6">
              <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No conversations yet.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Conversations will appear here once your connected accounts receive messages.
              </p>
            </div>
          ) : (
            filtered.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setSelectedId(conversation.id)}
                className={cn(
                  "w-full flex items-start gap-3 px-4 py-3 text-left border-b hover:bg-muted transition-colors",
                  selectedId === conversation.id && "bg-muted"
                )}
              >
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-muted-foreground/20 flex items-center justify-center text-sm font-semibold">
                    {(conversation.externalContactName || conversation.externalContactId)[0]?.toUpperCase()}
                  </div>
                  {conversation.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm truncate">
                      {conversation.externalContactName || conversation.externalContactId}
                    </p>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {timeAgo(conversation.lastMessageAt)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    via {conversation.socialAccount.displayName}
                  </p>
                  {conversation.lastMessagePreview && (
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      {conversation.lastMessagePreview}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Detail pane */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold">
            {selected ? selected.externalContactName || selected.externalContactId : "Select a conversation"}
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">
            {selected ? "No messages yet in this conversation." : "Select a conversation to view messages"}
          </p>
        </div>
      </div>
    </div>
  );
}
