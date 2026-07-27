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
import { Plus, Webhook as WebhookIcon, Trash2, Loader2 } from "lucide-react";

interface WebhookRow {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
}

const AVAILABLE_EVENTS = [
  "post.published",
  "post.partial",
  "post.failed",
  "account.connected",
  "account.disconnected",
];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/webhooks");
      setWebhooks(data.data);
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || "Failed to load webhooks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleEvent = (event: string) => {
    setEvents((prev) => (prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]));
  };

  const handleCreate = async () => {
    if (!url.trim() || events.length === 0) return;
    setCreating(true);
    try {
      await api.post("/api/webhooks", { url, events });
      toast.success("Webhook created");
      setCreateOpen(false);
      setUrl("");
      setEvents([]);
      load();
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || "Failed to create webhook");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this webhook?")) return;
    try {
      await api.delete(`/api/webhooks/${id}`);
      toast.success("Webhook deleted");
      load();
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || "Failed to delete webhook");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground mt-1">Get notified when posts publish, fail, or accounts change</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus size={16} />
          New Webhook
        </Button>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : webhooks.length === 0 ? (
          <div className="py-16 text-center">
            <WebhookIcon className="w-8 h-8 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No webhooks yet.</p>
            <Button variant="outline" onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus size={16} />
              Add a webhook
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {webhooks.map((webhook) => (
              <div key={webhook.id} className="flex items-center justify-between px-6 py-4">
                <div className="min-w-0">
                  <p className="font-medium truncate">{webhook.url}</p>
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    {webhook.events.map((event) => (
                      <Badge key={event} variant="outline" className="text-xs">
                        {event}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant={webhook.isActive ? "success" : "secondary"}>
                    {webhook.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(webhook.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Webhook</DialogTitle>
            <DialogDescription>The signing secret is shown once, right after creation.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Endpoint URL</Label>
              <Input
                id="webhook-url"
                placeholder="https://example.com/hooks/contentflow"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Events</Label>
              <div className="space-y-1.5">
                {AVAILABLE_EVENTS.map((event) => (
                  <label key={event} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={events.includes(event)}
                      onChange={() => toggleEvent(event)}
                      className="rounded border-input"
                    />
                    {event}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleCreate} disabled={!url.trim() || events.length === 0 || creating}>
              {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create webhook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
