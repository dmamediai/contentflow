"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  Users,
  Target,
  Zap,
  Twitter,
  Linkedin,
  Facebook,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [teamAnalytics, setTeamAnalytics] = useState<any>(null);
  const [trending, setTrending] = useState<any[]>([]);
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState<"7" | "30" | "90">("30");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [timeframe]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      const [summaryRes, analyticsRes, trendingRes, growthRes] = await Promise.all([
        api.get("/api/analytics/summary"),
        api.get(`/api/analytics/team?days=${timeframe}`),
        api.get("/api/analytics/trending?limit=5"),
        api.get(`/api/analytics/growth?days=${timeframe}`),
      ]);

      setSummary(summaryRes.data.data);
      setTeamAnalytics(analyticsRes.data.data);
      setTrending(trendingRes.data.data);
      setGrowthData(growthRes.data.data);
    } catch (error: any) {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const platformColors: Record<string, string> = {
    TWITTER: "#1DA1F2",
    LINKEDIN: "#0A66C2",
    FACEBOOK: "#1877F2",
    INSTAGRAM: "#E4405F",
    THREADS: "#000000",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">Track your social media performance</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={timeframe === "7" ? "default" : "outline"}
            onClick={() => setTimeframe("7")}
            size="sm"
          >
            7D
          </Button>
          <Button
            variant={timeframe === "30" ? "default" : "outline"}
            onClick={() => setTimeframe("30")}
            size="sm"
          >
            30D
          </Button>
          <Button
            variant={timeframe === "90" ? "default" : "outline"}
            onClick={() => setTimeframe("90")}
            size="sm"
          >
            90D
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Posts</p>
                  <p className="text-2xl font-bold">{summary.weekSummary.posts}</p>
                </div>
                <Zap className="w-8 h-8 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Engagement</p>
                  <p className="text-2xl font-bold">{summary.weekSummary.engagement}</p>
                </div>
                <Heart className="w-8 h-8 text-red-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reach</p>
                  <p className="text-2xl font-bold">{summary.weekSummary.reach}</p>
                </div>
                <Eye className="w-8 h-8 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Engagement Rate</p>
                  <p className="text-2xl font-bold">{summary.weekSummary.avgEngagementRate}%</p>
                </div>
                <Target className="w-8 h-8 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Growth</p>
                  <p className={`text-2xl font-bold ${summary.growthTrend > 0 ? "text-green-600" : "text-red-600"}`}>
                    {summary.growthTrend > 0 ? "+" : ""}{summary.growthTrend}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Audience Growth</CardTitle>
            <CardDescription>Follower growth over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="followers"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Platform Distribution */}
        {teamAnalytics && (
          <Card>
            <CardHeader>
              <CardTitle>Platform Distribution</CardTitle>
              <CardDescription>Posts by platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-2">
                    <Twitter className="w-4 h-4 text-blue-400" />
                    Twitter
                  </span>
                  <span className="font-semibold">32%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-blue-400 h-2 rounded-full" style={{ width: "32%" }} />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-2">
                    <Linkedin className="w-4 h-4 text-blue-600" />
                    LinkedIn
                  </span>
                  <span className="font-semibold">28%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: "28%" }} />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-2">
                    <Facebook className="w-4 h-4 text-blue-700" />
                    Facebook
                  </span>
                  <span className="font-semibold">40%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-blue-700 h-2 rounded-full" style={{ width: "40%" }} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Trending Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Posts</CardTitle>
          <CardDescription>Your best performing content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trending.map((post, idx) => (
              <div key={idx} className="flex items-start justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-semibold text-sm">{post.content}</p>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {post.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      {post.comments}
                    </span>
                    <span className="flex items-center gap-1">
                      <Share2 className="w-3 h-3" />
                      {post.shares}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">{post.engagementRate}%</p>
                  <p className="text-xs text-muted-foreground">Engagement</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Summary */}
      {teamAnalytics && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Summary</CardTitle>
            <CardDescription>Last {timeframe} days overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Posts</p>
                <p className="text-2xl font-bold">{teamAnalytics.totalPosts}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Likes</p>
                <p className="text-2xl font-bold">{teamAnalytics.totalLikes}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Comments</p>
                <p className="text-2xl font-bold">{teamAnalytics.totalComments}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Shares</p>
                <p className="text-2xl font-bold">{teamAnalytics.totalShares}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
