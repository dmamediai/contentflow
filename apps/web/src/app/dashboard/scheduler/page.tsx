"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  FileText,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Eye,
  Twitter,
  Linkedin,
  Facebook,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

export default function SchedulerPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day" | "list">("month");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"calendar" | "queue" | "drafts">("calendar");

  useEffect(() => {
    loadData();
  }, [currentDate, view]);

  const loadData = async () => {
    try {
      setLoading(true);

      if (view === "calendar") {
        const startDate = new Date(currentDate);
        startDate.setDate(1);

        const endDate = new Date(currentDate);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);

        const response = await api.get(
          `/api/scheduler/calendar?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        );
        setPosts(response.data.data);
      } else if (view === "queue") {
        const response = await api.get("/api/scheduler/queue?hours=72");
        setPosts(response.data.data);
      } else if (view === "drafts") {
        const response = await api.get("/api/scheduler/drafts");
        setPosts(response.data.data);
      }

      const statsResponse = await api.get("/api/scheduler/stats");
      setStats(statsResponse.data.data);
    } catch (error: any) {
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Delete this post?")) return;

    try {
      await api.delete(`/api/scheduler/${postId}`);
      setPosts(posts.filter((p) => p.id !== postId));
      toast.success("Post deleted");
    } catch (error: any) {
      toast.error("Failed to delete post");
    }
  };

  const handleMoveToDraft = async (postId: string) => {
    try {
      await api.post(`/api/scheduler/${postId}/move-to-draft`);
      setPosts(posts.map((p) => (p.id === postId ? { ...p, status: "DRAFT" } : p)));
      toast.success("Moved to drafts");
    } catch (error: any) {
      toast.error("Failed to move to drafts");
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getPostsByDate = (date: Date) => {
    return posts.filter((post) => {
      const postDate = new Date(post.scheduledAt);
      return (
        postDate.getDate() === date.getDate() &&
        postDate.getMonth() === date.getMonth() &&
        postDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const platformIcons: Record<string, any> = {
    TWITTER: Twitter,
    LINKEDIN: Linkedin,
    FACEBOOK: Facebook,
  };

  // Calendar days
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const calendarDays = [];

  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
  }

  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Content Scheduler</h1>
          <p className="text-muted-foreground mt-1">Plan and manage your social media posts</p>
        </div>
        <Button>
          <Calendar className="mr-2 h-4 w-4" />
          Schedule Post
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.totalScheduled}</p>
                <p className="text-xs text-muted-foreground">Scheduled</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.scheduledThisWeek}</p>
                <p className="text-xs text-muted-foreground">This Week</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.drafts}</p>
                <p className="text-xs text-muted-foreground">Drafts</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.published}</p>
                <p className="text-xs text-muted-foreground">Published</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.failed}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setView("calendar")}
          className={`flex items-center gap-2 px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            view === "calendar"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Calendar className="w-4 h-4" />
          Calendar
        </button>
        <button
          onClick={() => setView("queue")}
          className={`flex items-center gap-2 px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            view === "queue"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock className="w-4 h-4" />
          Queue (72h)
        </button>
        <button
          onClick={() => setView("drafts")}
          className={`flex items-center gap-2 px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            view === "drafts"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="w-4 h-4" />
          Drafts
        </button>
      </div>

      {/* Calendar View */}
      {view === "calendar" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{monthName}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center font-semibold text-xs py-2">
                    {day}
                  </div>
                ))}

                {calendarDays.map((date, idx) => {
                  const dayPosts = date ? getPostsByDate(date) : [];
                  const isToday =
                    date &&
                    date.toDateString() === new Date().toDateString();

                  return (
                    <div
                      key={idx}
                      onClick={() => date && setSelectedDate(date)}
                      className={`min-h-24 p-2 border rounded cursor-pointer transition-colors ${
                        !date
                          ? "bg-muted"
                          : isToday
                            ? "bg-primary/10 border-primary"
                            : "hover:bg-muted"
                      }`}
                    >
                      {date && (
                        <>
                          <p className="text-sm font-semibold">{date.getDate()}</p>
                          <div className="space-y-1 mt-1">
                            {dayPosts.slice(0, 2).map((post) => (
                              <div
                                key={post.id}
                                className={`text-xs p-1 rounded truncate ${
                                  post.status === "SCHEDULED"
                                    ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                                    : "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"
                                }`}
                              >
                                {post.content.substring(0, 20)}...
                              </div>
                            ))}
                            {dayPosts.length > 2 && (
                              <p className="text-xs text-muted-foreground">
                                +{dayPosts.length - 2} more
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Selected Day Posts */}
          {selectedDate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedDate.toLocaleDateString("default", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {getPostsByDate(selectedDate).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No posts scheduled</p>
                ) : (
                  getPostsByDate(selectedDate).map((post) => (
                    <div key={post.id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-2">
                          {post.socialAccounts.map((account: any) => {
                            const Icon = platformIcons[account.platform] || MessageCircle;
                            return <Icon key={account.id} className="w-4 h-4" />;
                          })}
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            post.status === "SCHEDULED"
                              ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                              : "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"
                          }`}
                        >
                          {post.status}
                        </span>
                      </div>
                      <p className="text-sm">{post.content}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(post.scheduledAt).toLocaleTimeString()}
                      </p>
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveToDraft(post.id)}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Queue/List View */}
      {(view === "queue" || view === "drafts") && (
        <div className="space-y-4">
          {posts.length === 0 ? (
            <Card>
              <CardContent className="pt-12 text-center pb-12">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No {view === "queue" ? "posts in queue" : "drafts"}
                </h3>
                <p className="text-muted-foreground">
                  {view === "queue"
                    ? "Nothing scheduled for the next 72 hours"
                    : "No draft posts yet"}
                </p>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold mb-2">{post.content}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(post.scheduledAt).toLocaleString()}
                        </span>
                        <div className="flex gap-1">
                          {post.socialAccounts.map((account: any) => {
                            const Icon = platformIcons[account.platform] || MessageCircle;
                            return (
                              <Icon
                                key={account.id}
                                className="w-4 h-4"
                                title={account.platform}
                              />
                            );
                          })}
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            post.status === "SCHEDULED"
                              ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                              : "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"
                          }`}
                        >
                          {post.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMoveToDraft(post.id)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600"
                        onClick={() => handleDeletePost(post.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
