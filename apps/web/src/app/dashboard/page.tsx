"use client";

import { useSession } from "next-auth/react";
import { useTeams } from "@/hooks/useTeams";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, FileText, Calendar, Users, TrendingUp, Clock } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  // Force redeploy
  const { data: session } = useSession();
  const { teams, loading } = useTeams();

  // Demo mode: use dummy data if not authenticated
  const currentTeam = teams[0] || { id: "demo", name: "Demo Team" };

  const stats = [
    {
      label: "Total Posts",
      value: "0",
      icon: FileText,
      color: "text-blue-600",
    },
    {
      label: "Scheduled",
      value: "0",
      icon: Calendar,
      color: "text-purple-600",
    },
    {
      label: "Team Members",
      value: "1",
      icon: Users,
      color: "text-green-600",
    },
    {
      label: "This Month",
      value: "0",
      icon: TrendingUp,
      color: "text-orange-600",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold">Welcome back!</h2>
          <p className="text-muted-foreground mt-2">Loading your dashboard...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card rounded-lg border p-6 animate-pulse">
              <div className="h-8 bg-muted rounded w-1/2 mb-2" />
              <div className="h-12 bg-muted rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">Welcome back, {session?.user?.name}!</h2>
        <p className="text-muted-foreground mt-2">
          {currentTeam
            ? `Team: ${currentTeam.name}`
            : "Create or join a team to get started"}
        </p>
      </div>

      {/* Quick Actions */}
      {currentTeam && (
        <div className="flex gap-4 flex-wrap">
          <Link href="/dashboard/studio" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
            <BarChart3 className="mr-2 h-4 w-4" />
            Create Post
          </Link>
          <Link href="/dashboard/calendar" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
            <Calendar className="mr-2 h-4 w-4" />
            View Calendar
          </Link>
          <Link href="/dashboard/settings" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
            <Users className="mr-2 h-4 w-4" />
            Team Settings
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <Icon className={`${stat.color} w-8 h-8 opacity-50`} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-muted-foreground">
            <Clock className="w-5 h-5 flex-shrink-0" />
            <p>No recent activity yet. Start by creating a post!</p>
          </div>
        </div>
      </Card>

      {/* Getting Started */}
      {!currentTeam && (
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold mb-2">Get Started</h3>
          <p className="text-muted-foreground mb-4">
            Create a team to start managing your social media content.
          </p>
          <Link href="/dashboard/teams" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
            Create Team
          </Link>
        </Card>
      )}
    </div>
  );
}
