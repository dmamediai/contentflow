"use client";

import { useState } from "react";
import { useTeams } from "@/hooks/useTeams";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Plus, MoreVertical } from "lucide-react";
import Link from "next/link";
import { CreateTeamDialog } from "@/components/teams/create-team-dialog";
import type { Team } from "@/types";

export default function TeamsPage() {
  const { teams, loading, createTeam } = useTeams();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Teams</h1>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            New Team
          </Button>
        </div>
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-card rounded-lg border p-6 animate-pulse">
              <div className="h-6 bg-muted rounded w-1/3 mb-4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Teams</h1>
          <p className="text-muted-foreground mt-2">
            Manage your teams and team members
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Team
        </Button>
      </div>

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No teams yet</h3>
            <p className="text-muted-foreground mb-6">
              Create a team to start managing your social media content
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              Create Your First Team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team: Team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      )}

      {/* Create Team Dialog */}
      <CreateTeamDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateTeam={async (data) => {
          await createTeam(data);
          setShowCreateDialog(false);
        }}
      />
    </div>
  );
}

function TeamCard({ team }: { team: Team }) {
  return (
    <Card className="hover:shadow-lg transition-shadow overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle>{team.name}</CardTitle>
            <CardDescription className="mt-2">
              {team.description || "No description"}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            Slug: <span className="font-mono text-foreground">{team.slug}</span>
          </p>
          <p className="text-muted-foreground">
            Created: {new Date(team.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2 mt-4">
          <Link href={`/dashboard/teams/${team.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              Manage
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
