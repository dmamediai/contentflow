"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ExternalLink, Loader2 } from "lucide-react";
import { getInitials } from "@/lib/utils";

type Tab = "usage" | "billing" | "profile" | "notifications" | "slack" | "ai" | "danger";

const TABS: { id: Tab; label: string; external?: boolean; danger?: boolean }[] = [
  { id: "usage", label: "Usage", external: true },
  { id: "billing", label: "Billing", external: true },
  { id: "profile", label: "Profile" },
  { id: "notifications", label: "Notifications" },
  { id: "slack", label: "Slack" },
  { id: "ai", label: "AI providers" },
  { id: "danger", label: "Danger Zone", danger: true },
];

interface Subscription {
  plan: string;
  status: string;
  postsUsed: number;
  postsLimit: number;
  aiCreditsUsed: number;
  aiCreditsLimit: number;
  teamMembersUsed: number;
  teamMembersLimit: number;
}

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const [tab, setTab] = useState<Tab>("profile");
  const [name, setName] = useState(session?.user?.name || "");
  const [image, setImage] = useState(session?.user?.image || "");
  const [saving, setSaving] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);

  useEffect(() => {
    setName(session?.user?.name || "");
    setImage(session?.user?.image || "");
  }, [session]);

  const loadSubscription = useCallback(async () => {
    try {
      const { data: teamsRes } = await api.get("/api/teams");
      const firstTeam = teamsRes.data[0];
      if (!firstTeam) return;
      setTeamId(firstTeam.id);
      const { data } = await api.get(`/api/teams/${firstTeam.id}/subscription`);
      setSubscription(data.data);
    } catch {
      // no team yet - leave usage/billing empty
    }
  }, []);

  useEffect(() => {
    if (tab === "usage" || tab === "billing") loadSubscription();
  }, [tab, loadSubscription]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await api.patch("/api/auth/profile", { name, ...(image && { image }) });
      await updateSession({ name, image });
      toast.success("Profile updated");
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!teamId) return;
    if (!confirm("Delete this team and all its data? This cannot be undone.")) return;
    try {
      await api.delete(`/api/teams/${teamId}`);
      toast.success("Team deleted");
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || "Failed to delete team");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your profile, notifications, and account</p>
      </div>

      <div className="border-b flex gap-6 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`pb-3 text-sm font-medium border-b-2 -mb-px flex items-center gap-1 ${
              tab === t.id
                ? t.danger
                  ? "border-destructive text-destructive"
                  : "border-foreground text-foreground"
                : t.danger
                  ? "border-transparent text-destructive/80"
                  : "border-transparent text-muted-foreground"
            }`}
          >
            {t.label}
            {t.external && <ExternalLink size={12} />}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <Card className="p-6 space-y-6 max-w-2xl">
          <div>
            <h2 className="font-semibold">Profile</h2>
            <p className="text-sm text-muted-foreground">Manage your account information</p>
          </div>

          <div className="space-y-2">
            <Label>Avatar</Label>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold overflow-hidden shrink-0">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt="" className="w-full h-full object-cover" />
                ) : (
                  getInitials(name)
                )}
              </div>
              <Input
                placeholder="Image URL"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="settings-name">Name</Label>
            <div className="flex gap-2">
              <Input id="settings-name" value={name} onChange={(e) => setName(e.target.value)} />
              <Button onClick={handleSaveProfile} disabled={saving} className="shrink-0">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={session?.user?.email || ""} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">
              Email is managed by your login provider and can&apos;t be changed here.
            </p>
          </div>
        </Card>
      )}

      {(tab === "usage" || tab === "billing") && (
        <Card className="p-6 max-w-2xl">
          {!subscription ? (
            <p className="text-sm text-muted-foreground">No subscription data yet.</p>
          ) : tab === "usage" ? (
            <div className="space-y-4">
              <h2 className="font-semibold">Usage this period</h2>
              <UsageBar label="Posts" used={subscription.postsUsed} limit={subscription.postsLimit} />
              <UsageBar label="AI credits" used={subscription.aiCreditsUsed} limit={subscription.aiCreditsLimit} />
              <UsageBar
                label="Team members"
                used={subscription.teamMembersUsed}
                limit={subscription.teamMembersLimit}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <h2 className="font-semibold">Plan</h2>
              <p className="text-2xl font-bold">{subscription.plan}</p>
              <p className="text-sm text-muted-foreground">Status: {subscription.status}</p>
              <Button variant="outline" onClick={() => toast.info("Billing portal not configured yet")}>
                Manage billing
              </Button>
            </div>
          )}
        </Card>
      )}

      {tab === "notifications" && (
        <Card className="p-6 max-w-2xl text-sm text-muted-foreground">
          Notification preferences aren&apos;t configurable yet.
        </Card>
      )}

      {tab === "slack" && (
        <Card className="p-6 max-w-2xl text-sm text-muted-foreground">
          No Slack workspace connected yet.
        </Card>
      )}

      {tab === "ai" && (
        <Card className="p-6 max-w-2xl text-sm text-muted-foreground">
          AI providers (OpenAI, Anthropic, Gemini) are configured via server environment variables, not per-team yet.
        </Card>
      )}

      {tab === "danger" && (
        <Card className="p-6 max-w-2xl border-destructive/30 space-y-4">
          <h2 className="font-semibold text-destructive">Danger Zone</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Sign out</p>
              <p className="text-xs text-muted-foreground">End your current session on this device.</p>
            </div>
            <Button variant="outline" onClick={() => signOut()}>
              Sign out
            </Button>
          </div>
          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <p className="text-sm font-medium">Delete team</p>
              <p className="text-xs text-muted-foreground">Permanently deletes this team and all its data.</p>
            </div>
            <Button variant="destructive" onClick={handleDeleteTeam} disabled={!teamId}>
              Delete team
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {used} / {limit || "∞"}
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div className="bg-primary h-2 rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
