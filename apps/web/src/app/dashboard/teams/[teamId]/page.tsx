"use client";

import { useTeam } from "@/hooks/useTeams";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Settings, Trash2, Crown, Shield, Eye } from "lucide-react";
import { useParams } from "next/navigation";

export default function TeamDetailsPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const { team, loading, error } = useTeam(teamId);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-card rounded-lg border p-6 animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-red-500 mb-4">{error || "Team not found"}</p>
          <Button variant="outline">Go Back</Button>
        </CardContent>
      </Card>
    );
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "OWNER":
        return <Crown className="w-4 h-4" />;
      case "ADMIN":
        return <Shield className="w-4 h-4" />;
      default:
        return <Eye className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Team Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl">{team.name}</CardTitle>
              <CardDescription className="mt-2">
                {team.description || "No description provided"}
              </CardDescription>
            </div>
            <Button variant="outline" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage your team members and their roles
              </CardDescription>
            </div>
            <Button>
              <Users className="mr-2 w-4 h-4" />
              Invite Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {team.members && team.members.length > 0 ? (
            <div className="space-y-2">
              {team.members.map((member: any) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                      {member.user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{member.user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {member.user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 px-3 py-1 rounded-md bg-muted text-sm">
                      {getRoleIcon(member.role)}
                      <span className="font-medium">{member.role}</span>
                    </div>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No members yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Posts</p>
              <p className="text-3xl font-bold mt-2">
                {team._count?.posts || 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Connected Accounts</p>
              <p className="text-3xl font-bold mt-2">
                {team._count?.socialAccounts || 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Team Members</p>
              <p className="text-3xl font-bold mt-2">
                {team.members?.length || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
