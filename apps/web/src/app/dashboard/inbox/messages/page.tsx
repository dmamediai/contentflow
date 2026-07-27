"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
import {
  Search,
  ChevronDown,
  PenSquare,
  MessageSquare,
  Loader2,
  MoreVertical,
  ExternalLink,
  Paperclip,
  Sparkles,
  Mic,
  Send,
  CheckCheck,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  content: string | null;
  mediaUrl: string | null;
  sentAt: string;
}

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

const PLATFORM_BADGE: Record<string, string> = {
  WHATSAPP: "bg-[#25D366]",
  INSTAGRAM: "bg-[#E4405F]",
  FACEBOOK: "bg-[#1877F2]",
  TWITTER: "bg-[#1DA1F2]",
  LINKEDIN: "bg-[#0A66C2]",
  THREADS: "bg-foreground",
  BLUESKY: "bg-[#0085FF]",
  TIKTOK: "bg-foreground",
  YOUTUBE: "bg-[#FF0000]",
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function clockTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  const [platformFilter, setPlatformFilter] = useState<string | "all">("all");
  const [profileFilter, setProfileFilter] = useState<string | "all">("all");
  const [accountFilter, setAccountFilter] = useState<string | "all">("all");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

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

  const openConversation = useCallback(async (id: string) => {
    setSelectedId(id);
    setThreadLoading(true);
    setMessages([]);
    try {
      const { data } = await api.get(`/api/inbox/conversations/${id}`);
      setMessages(data.data.messages || []);
      api.post(`/api/inbox/conversations/${id}/read`).catch(() => undefined);
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)));
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || "Failed to open conversation");
    } finally {
      setThreadLoading(false);
    }
  }, []);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!draft.trim() || !selectedId || sending) return;
    setSending(true);
    const content = draft;
    setDraft("");
    try {
      const { data } = await api.post(`/api/inbox/conversations/${selectedId}/messages`, { content });
      setMessages((prev) => [...prev, data.data]);
    } catch (error: any) {
      setDraft(content);
      toast.error(error?.response?.data?.error?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

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
          <FilterMenu
            label={platformFilter === "all" ? "All platforms" : platformFilter}
            options={[{ v: "all", l: "All platforms" }, ...Array.from(new Set(accounts.map((a) => a.platform))).map((p) => ({ v: p, l: p }))]}
            onSelect={setPlatformFilter}
          />
          <FilterMenu
            label={profileFilter === "all" ? "All profiles" : profiles.find((p) => p.id === profileFilter)?.name || ""}
            options={[{ v: "all", l: "All profiles" }, ...profiles.map((p) => ({ v: p.id, l: p.name }))]}
            onSelect={setProfileFilter}
          />
          <FilterMenu
            label={accountFilter === "all" ? "All accounts" : accounts.find((a) => a.id === accountFilter)?.displayName || ""}
            options={[{ v: "all", l: "All accounts" }, ...accounts.map((a) => ({ v: a.id, l: a.displayName }))]}
            onSelect={setAccountFilter}
          />
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
          <FilterMenu
            label={sort === "newest" ? "Newest first" : "Oldest first"}
            options={[{ v: "newest", l: "Newest first" }, { v: "oldest", l: "Oldest first" }]}
            onSelect={(v) => setSort(v as "newest" | "oldest")}
            align="end"
          />
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
                Conversations appear here once your connected accounts receive messages.
              </p>
            </div>
          ) : (
            filtered.map((conversation) => {
              const title = conversation.externalContactName || conversation.externalContactId;
              return (
                <button
                  key={conversation.id}
                  onClick={() => openConversation(conversation.id)}
                  className={cn(
                    "w-full flex items-start gap-3 px-4 py-3 text-left border-b hover:bg-muted/60 transition-colors",
                    selectedId === conversation.id && "bg-muted"
                  )}
                >
                  <Avatar title={title} platform={conversation.platform} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm truncate">
                        {title}
                        <span className="font-normal text-muted-foreground"> · via {conversation.socialAccount.displayName}</span>
                      </p>
                      <span className="text-xs text-muted-foreground shrink-0">{timeAgo(conversation.lastMessageAt)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessagePreview || "No messages yet"}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="w-2 h-2 rounded-full bg-destructive shrink-0" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Detail pane */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <p className="font-semibold">Select a conversation</p>
            <p className="text-sm text-muted-foreground mt-1">Select a conversation to view messages</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-5 py-3 border-b">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar title={selected.externalContactName || selected.externalContactId} platform={selected.platform} />
                <div className="min-w-0">
                  <p className="font-semibold truncate">{selected.externalContactName || selected.externalContactId}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    Replying as {selected.socialAccount.displayName} · Active {timeAgo(selected.lastMessageAt) || "now"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 text-muted-foreground">
                <Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink size={16} /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical size={16} /></Button>
              </div>
            </div>

            {/* Thread */}
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-1">
              {threadLoading ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">No messages in this conversation yet.</p>
                </div>
              ) : (
                messages.map((message, i) => {
                  const prev = messages[i - 1];
                  const showDay = !prev || dayLabel(prev.sentAt) !== dayLabel(message.sentAt);
                  return (
                    <div key={message.id}>
                      {showDay && (
                        <div className="flex justify-center my-4">
                          <span className="text-xs text-muted-foreground bg-muted rounded-full px-3 py-1">
                            {dayLabel(message.sentAt)}
                          </span>
                        </div>
                      )}
                      <MessageBubble message={message} />
                    </div>
                  );
                })
              )}
              <div ref={threadEndRef} />
            </div>

            {/* Composer */}
            <div className="px-5 py-4 border-t">
              <div className="flex items-end gap-2 border rounded-2xl px-4 py-2">
                <textarea
                  rows={1}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 resize-none bg-transparent outline-none text-sm py-1.5 max-h-32"
                />
                <div className="flex items-center gap-1 pb-0.5 text-muted-foreground">
                  <button className="p-1.5 hover:text-foreground transition-colors"><Paperclip size={18} /></button>
                  <button className="p-1.5 hover:text-foreground transition-colors"><Sparkles size={18} /></button>
                  <button className="p-1.5 hover:text-foreground transition-colors"><Mic size={18} /></button>
                  <button
                    onClick={handleSend}
                    disabled={!draft.trim() || sending}
                    className="ml-1 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FilterMenu({
  label,
  options,
  onSelect,
  align = "start",
}: {
  label: string;
  options: { v: string; l: string }[];
  onSelect: (v: string) => void;
  align?: "start" | "end";
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          {label}
          <ChevronDown size={14} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        {options.map((o) => (
          <DropdownMenuItem key={o.v} onClick={() => onSelect(o.v)}>
            {o.l}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Avatar({ title, platform }: { title: string; platform: string }) {
  return (
    <div className="relative shrink-0">
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
        {title[0]?.toUpperCase()}
      </div>
      <span
        className={cn(
          "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center",
          PLATFORM_BADGE[platform] || "bg-muted-foreground"
        )}
      >
        <MessageCircle size={8} className="text-white" fill="currentColor" />
      </span>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const outbound = message.direction === "OUTBOUND";
  return (
    <div className={cn("flex", outbound ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
          outbound
            ? "bg-lime-100 dark:bg-lime-900/25 text-foreground rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md"
        )}
      >
        {message.mediaUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={message.mediaUrl} alt="" className="rounded-lg mb-1.5 max-w-full max-h-72 object-cover" />
        )}
        {message.content && <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>}
        <div className={cn("flex items-center gap-1 mt-1", outbound ? "justify-end" : "justify-start")}>
          <span className="text-[10px] text-muted-foreground">{clockTime(message.sentAt)}</span>
          {outbound && <CheckCheck size={13} className="text-muted-foreground" />}
        </div>
      </div>
    </div>
  );
}
