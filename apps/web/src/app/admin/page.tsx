"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Building2,
  FileText,
  TrendingUp,
  Heart,
  MessageCircle,
  Share2,
  CheckCircle,
  AlertCircle,
  Server,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

interface DashboardStats {
  totalUsers: number;
  totalTeams: number;
  activeTeams: number;
  totalPosts: number;
  publishedPosts: number;
  totalSocialAccounts: number;
  avgPostsPerTeam: number;
  publishRate: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [dashRes, healthRes] = await Promise.all([
        api.get("/api/admin/dashboard"),
        api.get("/api/admin/system-health"),
      ]);

      setStats(dashRes.data.data.stats);
      setRecentUsers(dashRes.data.data.recentUsers);
      setHealth(healthRes.data.data);
    } catch (error: any) {
      toast.error("Failed to load admin dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">Platform overview and management</p>
      </div>

      {/* Key Metrics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-3xl font-bold">{stats.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Teams</p>
                  <p className="text-3xl font-bold">{stats.totalTeams}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.activeTeams} active
                  </p>
                </div>
                <Building2 className="w-8 h-8 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Posts</p>
                  <p className="text-3xl font-bold">{stats.totalPosts}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.publishedPosts} published
                  </p>
                </div>
                <FileText className="w-8 h-8 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Social Accounts</p>
                  <p className="text-3xl font-bold">{stats.totalSocialAccounts}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.publishRate}% publish rate
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Health */}
      {health && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 rounded border">
                <span>Database</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-muted-foreground">Connected</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded border">
                <span>API Uptime</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-muted-foreground">99.9%</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded border">
                <span>Auth Service</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-muted-foreground">Operational</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded border">
                <span>Publishing Service</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-muted-foreground">Operational</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Users */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Signups</CardTitle>
          <CardDescription>Last 5 users who joined</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-semibold">{user.name || user.email}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Management Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View and manage all users
            </p>
            <Button className="w-full">View Users</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Team Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View and manage all teams
            </p>
            <Button className="w-full">View Teams</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View and manage subscriptions
            </p>
            <Button className="w-full">View Subscriptions</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
