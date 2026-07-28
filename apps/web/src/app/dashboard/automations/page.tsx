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
import { Plus, Phone, Trash2, Loader2, MessageCircle, ChevronDown, Copy, Check, Zap } from "lucide-react";

interface WaAccount {
  id: string;
  displayName: string;
  platformAccountId: string;
}
interface Rule {
  id: string;
  keyword: string;
  matchType: "EXACT" | "CONTAINS" | "STARTS_WITH";
  responseText: string | null;
  responseMediaUrl: string | null;
  isActive: boolean;
  hitCount: number;
}
interface WebhookInfo {
  callbackUrl: string;
  verifyToken: string;
}

const MATCH_LABEL: Record<string, string> = {
  EXACT: "Exact match",
  CONTAINS: "Contains",
  STARTS_WITH: "Starts with",
};

export default function AutomationsPage() {
  const [accounts, setAccounts] = useState<WaAccount[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [webhook, setWebhook] = useState<WebhookInfo | null>(null);

  const [connectOpen, setConnectOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [waForm, setWaForm] = useState({ phoneNumberId: "", accessToken: "", wabaId: "", displayPhoneNumber: "" });
  const [copied, setCopied] = useState("");

  const [ruleOpen, setRuleOpen] = useState(false);
  const [savingRule, setSavingRule] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    keyword: "",
    matchType: "CONTAINS" as Rule["matchType"],
    responseText: "",
    responseMediaUrl: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [accRes, rulesRes] = await Promise.all([
        api.get("/api/whatsapp/accounts"),
        api.get("/api/whatsapp/keyword-replies"),
      ]);
      setAccounts(accRes.data.data);
      setRules(rulesRes.data.data);
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || "Failed to load automations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleConnect = async () => {
    if (!waForm.phoneNumberId || !waForm.accessToken) return;
    setConnecting(true);
    try {
      const { data } = await api.post("/api/whatsapp/connect", waForm);
      setWebhook(data.data.webhook);
      toast.success("WhatsApp number connected");
      setWaForm({ phoneNumberId: "", accessToken: "", wabaId: "", displayPhoneNumber: "" });
      load();
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || "Failed to connect");
    } finally {
      setConnecting(false);
    }
  };

  const handleCreateRule = async () => {
    if (!ruleForm.keyword.trim() || (!ruleForm.responseText.trim() && !ruleForm.responseMediaUrl.trim())) return;
    setSavingRule(true);
    try {
      await api.post("/api/whatsapp/keyword-replies", {
        keyword: ruleForm.keyword,
        matchType: ruleForm.matchType,
        ...(ruleForm.responseText.trim() && { responseText: ruleForm.responseText }),
        ...(ruleForm.responseMediaUrl.trim() && { responseMediaUrl: ruleForm.responseMediaUrl }),
      });
      toast.success("Auto-reply created");
      setRuleOpen(false);
      setRuleForm({ keyword: "", matchType: "CONTAINS", responseText: "", responseMediaUrl: "" });
      load();
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || "Failed to create rule");
    } finally {
      setSavingRule(false);
    }
  };

  const toggleRule = async (rule: Rule) => {
    try {
      await api.patch(`/api/whatsapp/keyword-replies/${rule.id}`, { isActive: !rule.isActive });
      setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, isActive: !r.isActive } : r)));
    } catch (error: any) {
      toast.error("Failed to update rule");
    }
  };

  const deleteRule = async (id: string) => {
    if (!confirm("Delete this auto-reply?")) return;
    try {
      await api.delete(`/api/whatsapp/keyword-replies/${id}`);
      toast.success("Deleted");
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch (error: any) {
      toast.error("Failed to delete");
    }
  };

  const copy = (label: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(""), 1500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">WhatsApp Automation</h1>
        <p className="text-muted-foreground mt-1">Connect your number and auto-reply to messages by keyword</p>
      </div>

      {/* WhatsApp connection */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2 font-semibold">
            <Phone size={18} className="text-[#25D366]" />
            WhatsApp Numbers
          </div>
          <Button size="sm" onClick={() => setConnectOpen(true)} className="gap-2">
            <Plus size={15} />
            Connect number
          </Button>
        </div>
        {loading ? (
          <div className="py-10 text-center">
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="py-10 text-center px-6">
            <p className="text-sm text-muted-foreground">No WhatsApp number connected yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Connect your Meta Cloud API number to receive messages and auto-reply.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {accounts.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="font-medium text-sm">{a.displayName}</p>
                  <p className="text-xs text-muted-foreground">Phone number ID: {a.platformAccountId}</p>
                </div>
                <Badge variant="success">Connected</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Keyword auto-replies */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2 font-semibold">
            <Zap size={18} className="text-primary" />
            Keyword Auto-Replies
          </div>
          <Button size="sm" onClick={() => setRuleOpen(true)} className="gap-2">
            <Plus size={15} />
            New rule
          </Button>
        </div>
        {loading ? (
          <div className="py-10 text-center">
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : rules.length === 0 ? (
          <div className="py-10 text-center px-6">
            <MessageCircle className="w-7 h-7 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No auto-replies yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Create a rule so a keyword like &quot;price&quot; instantly replies with your answer.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {rules.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-6 py-3 gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">&quot;{r.keyword}&quot;</span>
                    <Badge variant="outline" className="text-xs">{MATCH_LABEL[r.matchType]}</Badge>
                    {r.hitCount > 0 && <span className="text-xs text-muted-foreground">· {r.hitCount} hits</span>}
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {r.responseText || (r.responseMediaUrl ? "[image reply]" : "")}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleRule(r)}
                    className={`text-xs px-2 py-1 rounded-full border ${r.isActive ? "bg-primary/15 border-primary/40 text-primary" : "text-muted-foreground"}`}
                  >
                    {r.isActive ? "Active" : "Paused"}
                  </button>
                  <Button variant="ghost" size="icon" onClick={() => deleteRule(r.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Connect dialog */}
      <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect WhatsApp (Meta Cloud API)</DialogTitle>
            <DialogDescription>
              From Meta → WhatsApp → API Setup: paste your Phone number ID and a permanent access token.
            </DialogDescription>
          </DialogHeader>

          {webhook ? (
            <div className="space-y-3">
              <p className="text-sm text-green-600 font-medium">✓ Connected. Now finish the webhook in Meta:</p>
              <div className="space-y-2 text-sm">
                <div>
                  <Label>Callback URL</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 rounded-md border bg-muted px-2 py-1.5 text-xs break-all">{webhook.callbackUrl}</code>
                    <Button variant="outline" size="icon" onClick={() => copy("url", webhook.callbackUrl)}>
                      {copied === "url" ? <Check size={14} /> : <Copy size={14} />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Verify token</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 rounded-md border bg-muted px-2 py-1.5 text-xs break-all">{webhook.verifyToken}</code>
                    <Button variant="outline" size="icon" onClick={() => copy("tok", webhook.verifyToken)}>
                      {copied === "tok" ? <Check size={14} /> : <Copy size={14} />}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  In Meta → WhatsApp → Configuration → Webhook: paste both, then subscribe to the <b>messages</b> field.
                </p>
              </div>
              <DialogFooter>
                <Button onClick={() => { setConnectOpen(false); setWebhook(null); }}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Phone number ID *</Label>
                  <Input value={waForm.phoneNumberId} onChange={(e) => setWaForm({ ...waForm, phoneNumberId: e.target.value })} placeholder="e.g. 123456789012345" />
                </div>
                <div className="space-y-1.5">
                  <Label>Access token *</Label>
                  <Input type="password" value={waForm.accessToken} onChange={(e) => setWaForm({ ...waForm, accessToken: e.target.value })} placeholder="Permanent access token" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>WABA ID</Label>
                    <Input value={waForm.wabaId} onChange={(e) => setWaForm({ ...waForm, wabaId: e.target.value })} placeholder="optional" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Display number</Label>
                    <Input value={waForm.displayPhoneNumber} onChange={(e) => setWaForm({ ...waForm, displayPhoneNumber: e.target.value })} placeholder="+1 555…" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleConnect} disabled={!waForm.phoneNumberId || !waForm.accessToken || connecting}>
                  {connecting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Connect
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* New rule dialog */}
      <Dialog open={ruleOpen} onOpenChange={setRuleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New auto-reply</DialogTitle>
            <DialogDescription>When an incoming message matches the keyword, send this reply automatically.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Keyword</Label>
                <Input value={ruleForm.keyword} onChange={(e) => setRuleForm({ ...ruleForm, keyword: e.target.value })} placeholder="e.g. price" />
              </div>
              <div className="space-y-1.5">
                <Label>Match</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-full flex items-center justify-between border rounded-md px-3 h-10 text-sm">
                      {MATCH_LABEL[ruleForm.matchType]}
                      <ChevronDown size={14} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {(["CONTAINS", "EXACT", "STARTS_WITH"] as const).map((m) => (
                      <DropdownMenuItem key={m} onClick={() => setRuleForm({ ...ruleForm, matchType: m })}>
                        {MATCH_LABEL[m]}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Reply text</Label>
              <textarea
                value={ruleForm.responseText}
                onChange={(e) => setRuleForm({ ...ruleForm, responseText: e.target.value })}
                rows={3}
                placeholder="Hi! Our monthly plan is $29…"
                className="w-full px-3 py-2 border rounded-md bg-background text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Image URL (optional)</Label>
              <Input value={ruleForm.responseMediaUrl} onChange={(e) => setRuleForm({ ...ruleForm, responseMediaUrl: e.target.value })} placeholder="https://…/pricing.png" />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleCreateRule}
              disabled={!ruleForm.keyword.trim() || (!ruleForm.responseText.trim() && !ruleForm.responseMediaUrl.trim()) || savingRule}
            >
              {savingRule && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
