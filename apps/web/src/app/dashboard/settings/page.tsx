"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Bell, Lock, Palette, LogOut } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Lock },
    { id: "appearance", label: "Appearance", icon: Palette },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Tabs */}
        <div className="md:col-span-1">
          <div className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="md:col-span-3">
          {activeTab === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <input
                    type="text"
                    placeholder="Your name"
                    className="w-full mt-1 px-4 py-2 border rounded-lg bg-background"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="w-full mt-1 px-4 py-2 border rounded-lg bg-background"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Bio</label>
                  <textarea
                    placeholder="Tell us about yourself"
                    rows={4}
                    className="w-full mt-1 px-4 py-2 border rounded-lg bg-background"
                  />
                </div>
                <Button onClick={() => toast.success("Profile updated!")}>
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Control how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive updates via email</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">Browser push notifications</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Weekly Digest</p>
                    <p className="text-sm text-muted-foreground">Get a weekly summary</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "security" && (
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-medium mb-3">Change Password</p>
                  <input
                    type="password"
                    placeholder="Current password"
                    className="w-full mb-2 px-4 py-2 border rounded-lg bg-background"
                  />
                  <input
                    type="password"
                    placeholder="New password"
                    className="w-full mb-2 px-4 py-2 border rounded-lg bg-background"
                  />
                  <input
                    type="password"
                    placeholder="Confirm password"
                    className="w-full px-4 py-2 border rounded-lg bg-background"
                  />
                  <Button className="mt-3" onClick={() => toast.success("Password updated!")}>
                    Update Password
                  </Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="font-medium mb-2">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground mb-3">Add an extra layer of security</p>
                  <Button variant="outline">Enable 2FA</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "appearance" && (
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize your interface</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <p className="font-medium">Theme</p>
                  <div className="grid grid-cols-3 gap-3">
                    <button className="p-3 border-2 border-primary rounded-lg">Light</button>
                    <button className="p-3 border rounded-lg hover:border-primary">Dark</button>
                    <button className="p-3 border rounded-lg hover:border-primary">Auto</button>
                  </div>
                </div>
                <div>
                  <p className="font-medium mb-3">Compact Mode</p>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Use compact layout</span>
                    <input type="checkbox" className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => toast.info("Sign out functionality - backend required")}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
          <Button
            variant="outline"
            className="w-full text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => toast.error("Account deletion - backend required")}
          >
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
