"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Twitter,
  Linkedin,
  Facebook,
  Instagram,
  Trash2,
  Link as LinkIcon,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

interface SocialAccount {
  id: string;
  platform: string;
  displayName: string;
  username: string;
  profileImage: string;
  connectedAt: string;
}

export default function SocialPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/oauth/accounts");
      setAccounts(response.data.data);
    } catch (error: any) {
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platform: string) => {
    try {
      setConnecting(platform);
      const response = await api.get(`/api/oauth/authorize/${platform}`);

      // Redirect to OAuth provider
      window.location.href = response.data.data.authUrl;
    } catch (error: any) {
      toast.error(`Failed to connect ${platform}`);
      setConnecting(null);
    }
  };

  const handleDisconnect = async (accountId: string, platform: string) => {
    if (!confirm(`Disconnect ${platform}?`)) return;

    try {
      await api.delete(`/api/oauth/accounts/${accountId}`);
      setAccounts(accounts.filter((a) => a.id !== accountId));
      toast.success(`${platform} disconnected`);
    } catch (error: any) {
      toast.error("Failed to disconnect account");
    }
  };

  const platformIcons: Record<string, any> = {
    TWITTER: Twitter,
    LINKEDIN: Linkedin,
    FACEBOOK: Facebook,
    INSTAGRAM: Instagram,
  };

  const platformColors: Record<string, string> = {
    TWITTER: "text-blue-400 bg-blue-50 dark:bg-blue-900/20",
    LINKEDIN: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
    FACEBOOK: "text-blue-700 bg-blue-50 dark:bg-blue-900/20",
    INSTAGRAM: "text-pink-600 bg-pink-50 dark:bg-pink-900/20",
  };

  const platforms = [
    { id: "TWITTER", name: "Twitter/X", icon: Twitter },
    { id: "LINKEDIN", name: "LinkedIn", icon: Linkedin },
    { id: "FACEBOOK", name: "Facebook", icon: Facebook },
    { id: "INSTAGRAM", name: "Instagram", icon: Instagram },
  ];

  const connectedPlatforms = accounts.map((a) => a.platform);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Social Media Accounts</h1>
        <p className="text-muted-foreground mt-1">Connect your social media accounts to publish</p>
      </div>

      {/* Connected Accounts */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Connected Accounts</h2>
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mx-auto" />
          </div>
        ) : accounts.length === 0 ? (
          <Card>
            <CardContent className="pt-12 text-center pb-12">
              <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No accounts connected</h3>
              <p className="text-muted-foreground mb-6">
                Connect your social media accounts to start publishing
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {accounts.map((account) => {
              const Icon = platformIcons[account.platform];
              return (
                <Card key={account.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {Icon && <Icon className={`w-8 h-8 ${platformColors[account.platform]}`} />}
                        <div>
                          <p className="font-semibold">{account.displayName}</p>
                          <p className="text-sm text-muted-foreground">@{account.username}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Connected {new Date(account.connectedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDisconnect(account.id, account.platform)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Available Platforms */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Available Platforms</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {platforms.map((platform) => {
            const Icon = platform.icon;
            const isConnected = connectedPlatforms.includes(platform.id);

            return (
              <Card key={platform.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className={`w-6 h-6 ${platformColors[platform.id]}`} />
                      <div>
                        <p className="font-semibold">{platform.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {isConnected ? "Connected" : "Not connected"}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleConnect(platform.id)}
                      disabled={isConnected || connecting === platform.id}
                      variant={isConnected ? "outline" : "default"}
                    >
                      {connecting === platform.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Connecting...
                        </>
                      ) : isConnected ? (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Connected
                        </>
                      ) : (
                        <>
                          <LinkIcon className="mr-2 h-4 w-4" />
                          Connect
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Info */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-base">Why connect accounts?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            ✅ <span className="font-semibold">Publish across platforms</span> - Schedule and publish to multiple networks at once
          </p>
          <p>
            ✅ <span className="font-semibold">Track analytics</span> - See engagement metrics for each platform
          </p>
          <p>
            ✅ <span className="font-semibold">Centralized management</span> - Manage all accounts from one dashboard
          </p>
          <p>
            ✅ <span className="font-semibold">Secure authentication</span> - OAuth ensures your accounts are secure
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
