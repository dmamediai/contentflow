"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  ChevronDown,
  Plug2,
  Twitter,
  Linkedin,
  Facebook,
  Instagram,
  MessageCircle,
  Cloud,
  Trash2,
  Loader2,
} from "lucide-react";

interface Profile {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  _count?: { accounts: number };
}

interface Account {
  id: string;
  profileId: string;
  platform: string;
  displayName: string;
  username: string;
  profileImage: string | null;
  connectedAt: string;
}

const OAUTH_PLATFORMS = [
  { id: "TWITTER", name: "Twitter / X", icon: Twitter },
  { id: "LINKEDIN", name: "LinkedIn", icon: Linkedin },
  { id: "FACEBOOK", name: "Facebook", icon: Facebook },
  { id: "INSTAGRAM", name: "Instagram", icon: Instagram },
  { id: "THREADS", name: "Threads", icon: MessageCircle },
];

const PLATFORM_ICONS: Record<string, any> = {
  TWITTER: Twitter,
  LINKEDIN: Linkedin,
  FACEBOOK: Facebook,
  INSTAGRAM: Instagram,
  THREADS: MessageCircle,
  BLUESKY: Cloud,
};

export default function ConnectionsPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfileId, setSelectedProfileId] = useState<string | "all">("all");
  const [platformFilter, setPlatformFilter] = useState<string | "all">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [connectOpen, setConnectOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [blueskyForm, setBlueskyForm] = useState({ identifier: "", appPassword: "" });
  const [profileForm, setProfileForm] = useState({ name: "", description: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [profilesRes, accountsRes] = await Promise.all([
        api.get("/api/profiles"),
        api.get("/api/oauth/accounts", {
          params: selectedProfileId !== "all" ? { profileId: selectedProfileId } : {},
        }),
      ]);
      setProfiles(profilesRes.data.data);
      setAccounts(accountsRes.data.data);
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || "Failed to load connections");
    } finally {
      setLoading(false);
    }
  }, [selectedProfileId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredAccounts = accounts.filter((a) => {
    if (platformFilter !== "all" && a.platform !== platformFilter) return false;
    return true;
  });

  const profileName = (id: string) => profiles.find((p) => p.id === id)?.name || "Unknown";

  const handleConnectOAuth = async (platform: string, profileId?: string) => {
    setConnecting(platform);
    try {
      const targetProfileId =
        profileId || (selectedProfileId !== "all" ? selectedProfileId : profiles.find((p) => p.isDefault)?.id);
      const { data } = await api.get(`/api/oauth/authorize/${platform.toLowerCase()}`);
      if (data?.data?.authUrl) {
        window.location.href = data.data.authUrl;
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || `Failed to start ${platform} connection`);
      setConnecting(null);
    }
  };

  const handleConnectBluesky = async () => {
    setConnecting("BLUESKY");
    try {
      const targetProfileId = selectedProfileId !== "all" ? selectedProfileId : undefined;
      await api.post("/api/oauth/bluesky/credentials", { ...blueskyForm, profileId: targetProfileId });
      toast.success("Bluesky account connected");
      setConnectOpen(false);
      setBlueskyForm({ identifier: "", appPassword: "" });
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || "Failed to connect Bluesky account");
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    if (!confirm("Disconnect this account?")) return;
    try {
      await api.delete(`/api/oauth/accounts/${accountId}`);
      toast.success("Account disconnected");
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || "Failed to disconnect account");
    }
  };

  const handleCreateProfile = async () => {
    if (!profileForm.name.trim()) return;
    setSavingProfile(true);
    try {
      await api.post("/api/profiles", profileForm);
      toast.success("Profile created");
      setProfileDialogOpen(false);
      setProfileForm({ name: "", description: "" });
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || "Failed to create profile");
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Connections</h1>
          <p className="text-muted-foreground mt-1">Manage profiles and platform integrations</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button onClick={() => setConnectOpen(true)} className="gap-2">
            <Plus size={16} />
            New Connection
          </Button>
          <Button variant="outline" onClick={() => setProfileDialogOpen(true)} className="gap-2">
            New Profile
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm">Platforms</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                {selectedProfileId === "all" ? "All profiles" : profileName(selectedProfileId)}
                <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setSelectedProfileId("all")}>All profiles</DropdownMenuItem>
              {profiles.map((p) => (
                <DropdownMenuItem key={p.id} onClick={() => setSelectedProfileId(p.id)}>
                  {p.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                {platformFilter === "all" ? "All platforms" : platformFilter}
                <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setPlatformFilter("all")}>All platforms</DropdownMenuItem>
              {Object.keys(PLATFORM_ICONS).map((p) => (
                <DropdownMenuItem key={p} onClick={() => setPlatformFilter(p)}>
                  {p}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                {statusFilter === "all" ? "All statuses" : statusFilter}
                <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setStatusFilter("all")}>All statuses</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("Connected")}>Connected</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Accounts */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="py-16 text-center">
            <Plug2 className="w-8 h-8 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No accounts connected yet.</p>
            <Button variant="outline" onClick={() => setConnectOpen(true)} className="gap-2">
              <Plus size={16} />
              Connect an account
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {filteredAccounts.map((account) => {
              const Icon = PLATFORM_ICONS[account.platform] || Plug2;
              return (
                <div key={account.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-4">
                    <Icon className="w-6 h-6 text-muted-foreground shrink-0" />
                    <div>
                      <p className="font-medium">{account.displayName}</p>
                      <p className="text-sm text-muted-foreground">@{account.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{profileName(account.profileId)}</Badge>
                    <Badge variant="success">Connected</Badge>
                    <Button variant="ghost" size="icon" onClick={() => handleDisconnect(account.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* New Connection dialog */}
      <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Connection</DialogTitle>
            <DialogDescription>Choose a platform to connect an account.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2">
            {OAUTH_PLATFORMS.map((platform) => {
              const Icon = platform.icon;
              return (
                <button
                  key={platform.id}
                  onClick={() => handleConnectOAuth(platform.id)}
                  disabled={connecting === platform.id}
                  className="flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                >
                  {connecting === platform.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                  {platform.name}
                </button>
              );
            })}
          </div>

          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Cloud className="w-4 h-4" />
              Bluesky (handle + App Password)
            </div>
            <div className="space-y-2">
              <Label htmlFor="bsky-identifier">Handle</Label>
              <Input
                id="bsky-identifier"
                placeholder="yourhandle.bsky.social"
                value={blueskyForm.identifier}
                onChange={(e) => setBlueskyForm({ ...blueskyForm, identifier: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bsky-password">App Password</Label>
              <Input
                id="bsky-password"
                type="password"
                placeholder="xxxx-xxxx-xxxx-xxxx"
                value={blueskyForm.appPassword}
                onChange={(e) => setBlueskyForm({ ...blueskyForm, appPassword: e.target.value })}
              />
            </div>
            <Button
              onClick={handleConnectBluesky}
              disabled={!blueskyForm.identifier || !blueskyForm.appPassword || connecting === "BLUESKY"}
              className="w-full"
            >
              {connecting === "BLUESKY" && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Connect Bluesky
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Profile dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Profile</DialogTitle>
            <DialogDescription>
              Profiles group connected accounts together, e.g. one per client or brand.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Name</Label>
              <Input
                id="profile-name"
                placeholder="e.g. Client A"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-description">Description (optional)</Label>
              <Input
                id="profile-description"
                value={profileForm.description}
                onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleCreateProfile} disabled={!profileForm.name.trim() || savingProfile}>
              {savingProfile && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
