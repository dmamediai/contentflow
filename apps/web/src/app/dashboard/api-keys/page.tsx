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
import { Plus, Lock, Trash2, Loader2, Copy, Check } from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scope: "FULL" | "READ_ONLY";
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadKeys = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/api-keys");
      setKeys(data.data);
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || "Failed to load API keys");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const { data } = await api.post("/api/api-keys", { name });
      setNewKey(data.data.key);
      setName("");
      loadKeys();
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || "Failed to create API key");
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Revoke this API key? This cannot be undone.")) return;
    try {
      await api.delete(`/api/api-keys/${id}`);
      toast.success("API key revoked");
      loadKeys();
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || "Failed to revoke API key");
    }
  };

  const closeCreateDialog = () => {
    setCreateOpen(false);
    setNewKey(null);
    setCopied(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-muted-foreground mt-1">Authenticate requests to the public v1 API</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus size={16} />
          New API Key
        </Button>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : keys.length === 0 ? (
          <div className="py-16 text-center">
            <Lock className="w-8 h-8 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No API keys yet.</p>
            <Button variant="outline" onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus size={16} />
              Create an API key
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {keys.map((key) => (
              <div key={key.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="font-medium">{key.name}</p>
                  <p className="text-sm text-muted-foreground font-mono">{key.keyPrefix}...</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{key.scope}</Badge>
                  {key.revokedAt ? (
                    <Badge variant="destructive">Revoked</Badge>
                  ) : (
                    <Badge variant="success">Active</Badge>
                  )}
                  {!key.revokedAt && (
                    <Button variant="ghost" size="icon" onClick={() => handleRevoke(key.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={createOpen} onOpenChange={(open) => (open ? setCreateOpen(true) : closeCreateDialog())}>
        <DialogContent>
          {newKey ? (
            <>
              <DialogHeader>
                <DialogTitle>API key created</DialogTitle>
                <DialogDescription>
                  Copy this key now - it won&apos;t be shown again.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-md border bg-muted px-3 py-2 text-sm font-mono break-all">
                  {newKey}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(newKey);
                    setCopied(true);
                  }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </Button>
              </div>
              <DialogFooter>
                <Button onClick={closeCreateDialog}>Done</Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>New API Key</DialogTitle>
                <DialogDescription>Used to authenticate requests to /api/v1.</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="key-name">Name</Label>
                <Input
                  id="key-name"
                  placeholder="e.g. Production key"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={!name.trim() || creating}>
                  {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
