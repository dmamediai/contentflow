"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChevronDown, Loader2, Heart } from "lucide-react";

interface Summary {
  weekSummary: { posts: number; engagement: number; reach: number; avgEngagementRate: number };
  monthSummary: { posts: number; engagement: number; reach: number; avgEngagementRate: number };
  trending: { id: string; content: string; likes: number }[];
}

interface PlatformBreakdown {
  platform: string;
  count: number;
  percentage: number;
}

const DAY_OPTIONS = [
  { label: "Last 7 days", value: 7 },
  { label: "Last 30 days", value: 30 },
  { label: "Last 90 days", value: 90 },
];

export default function AnalyticsPage() {
  const [tab, setTab] = useState<"posting" | "inbox">("posting");
  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [breakdown, setBreakdown] = useState<PlatformBreakdown[]>([]);
  const [growth, setGrowth] = useState<{ date: string; followers: number }[]>([]);
  const [conversationCount, setConversationCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadPostingAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, breakdownRes, growthRes] = await Promise.all([
        api.get("/api/analytics/summary"),
        api.get("/api/analytics/platform-breakdown", { params: { days } }),
        api.get("/api/analytics/growth", { params: { days } }),
      ]);
      setSummary(summaryRes.data.data);
      setBreakdown(breakdownRes.data.data);
      setGrowth(growthRes.data.data);
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [days]);

  const loadInboxAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/inbox/conversations");
      setConversationCount(data.data.length);
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || "Failed to load inbox analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "posting") loadPostingAnalytics();
    else loadInboxAnalytics();
  }, [tab, loadPostingAnalytics, loadInboxAnalytics]);

  const postsPerWeek = growth.reduce<{ week: string; count: number }[]>((acc, point, i) => {
    if (i % 7 === 0) acc.push({ week: point.date, count: 0 });
    return acc;
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">View post performance metrics</p>
      </div>

      <div className="border-b flex gap-6">
        <button
          onClick={() => setTab("posting")}
          className={`pb-3 text-sm font-medium border-b-2 -mb-px ${
            tab === "posting" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"
          }`}
        >
          Posting analytics
        </button>
        <button
          onClick={() => setTab("inbox")}
          className={`pb-3 text-sm font-medium border-b-2 -mb-px ${
            tab === "inbox" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"
          }`}
        >
          Inbox analytics
        </button>
      </div>

      {tab === "posting" && (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 border rounded-md px-3 py-2 text-sm hover:bg-muted">
                  {DAY_OPTIONS.find((d) => d.value === days)?.label}
                  <ChevronDown size={14} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {DAY_OPTIONS.map((d) => (
                  <DropdownMenuItem key={d.value} onClick={() => setDays(d.value)}>
                    {d.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard label="Engagement rate" value={`${summary?.monthSummary.avgEngagementRate ?? 0}%`} />
                <StatCard label="Total reach" value={summary?.monthSummary.reach ?? 0} />
                <StatCard label="Total followers" value={growth[growth.length - 1]?.followers ?? 0} />
                <StatCard label="Posts this period" value={summary?.monthSummary.posts ?? 0} />
                <StatCard
                  label="Best post"
                  value={summary?.trending[0] ? `${summary.trending[0].likes} likes` : "No data"}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="p-4">
                  <p className="font-semibold text-sm">Posts per platform</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    {breakdown.length === 0 ? "No posts in this window" : `Last ${days} days`}
                  </p>
                  {breakdown.length === 0 ? (
                    <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                      No posts yet
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={breakdown}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="platform" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Card>

                <Card className="p-4">
                  <p className="font-semibold text-sm">Posts over time</p>
                  <p className="text-xs text-muted-foreground mb-4">Posts per week - last {days} days</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={growth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={11} tickFormatter={(v) => v.slice(5)} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Line type="monotone" dataKey="followers" stroke="#2563eb" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-sm flex items-center gap-1.5">
                      <Heart size={14} />
                      Likes per platform
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    {summary?.monthSummary.engagement ? `Last ${days} days` : "No likes reported in this window"}
                  </p>
                  <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                    No likes data yet
                  </div>
                </Card>

                <Card className="p-4">
                  <p className="font-semibold text-sm">Likes over time</p>
                  <p className="text-xs text-muted-foreground mb-4">No likes reported in this window</p>
                  <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                    No likes data yet
                  </div>
                </Card>
              </div>
            </>
          )}
        </>
      )}

      {tab === "inbox" && (
        <>
          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Conversations" value={conversationCount} />
              <StatCard label="Unread" value={0} />
              <StatCard label="Avg. response time" value="No data" />
              <StatCard label="Response rate" value="No data" />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </Card>
  );
}
