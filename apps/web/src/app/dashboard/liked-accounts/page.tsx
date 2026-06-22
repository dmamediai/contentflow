"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Star, Trash2, ExternalLink, Search, Filter, Heart, MessageCircle, Share2, X } from "lucide-react";
import { toast } from "sonner";

interface LikedAccount {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  followers: number;
  verified: boolean;
  profileImage: string;
  url: string;
  savedAt: string;
  category: string;
  engagementRate: number;
  lastEngaged: string;
}

const DEMO_LIKED_ACCOUNTS: LikedAccount[] = [
  {
    id: "1",
    username: "elonmusk",
    displayName: "Elon Musk",
    bio: "CEO of Tesla, SpaceX, and Neuralink",
    followers: 195000000,
    verified: true,
    profileImage: "https://via.placeholder.com/50",
    url: "https://x.com/elonmusk",
    savedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    category: "Technology",
    engagementRate: 8.5,
    lastEngaged: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    username: "OpenAI",
    displayName: "OpenAI",
    bio: "Building safe, beneficial AI",
    followers: 2500000,
    verified: true,
    profileImage: "https://via.placeholder.com/50",
    url: "https://x.com/OpenAI",
    savedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    category: "AI",
    engagementRate: 5.2,
    lastEngaged: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    username: "andrew_ng",
    displayName: "Andrew Ng",
    bio: "Co-founder of Coursera, AI expert",
    followers: 850000,
    verified: true,
    profileImage: "https://via.placeholder.com/50",
    url: "https://x.com/andrew_ng",
    savedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    category: "AI",
    engagementRate: 6.1,
    lastEngaged: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "4",
    username: "paulg",
    displayName: "Paul Graham",
    bio: "Startup investor, Y Combinator",
    followers: 650000,
    verified: true,
    profileImage: "https://via.placeholder.com/50",
    url: "https://x.com/paulg",
    savedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    category: "Startups",
    engagementRate: 7.3,
    lastEngaged: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const CATEGORIES = ["All", "Technology", "AI", "Startups", "Marketing", "Business"];

export default function LikedAccountsPage() {
  const [accounts, setAccounts] = useState<LikedAccount[]>(DEMO_LIKED_ACCOUNTS);
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAccountUsername, setNewAccountUsername] = useState("");
  const [newAccountCategory, setNewAccountCategory] = useState("Technology");

  const filteredAccounts = accounts.filter((account) => {
    const matchesCategory = filter === "All" || account.category === filter;
    const matchesSearch =
      account.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleRemove = (id: string) => {
    setAccounts(accounts.filter((a) => a.id !== id));
    toast.success("Account removed from favorites");
  };

  const handleAddAccount = async () => {
    if (!newAccountUsername.trim()) {
      toast.error("Please enter a username");
      return;
    }

    // Demo mode: simulate adding account
    const newAccount: LikedAccount = {
      id: Date.now().toString(),
      username: newAccountUsername.toLowerCase(),
      displayName: newAccountUsername,
      bio: "Demo account bio",
      followers: Math.floor(Math.random() * 5000000),
      verified: Math.random() > 0.7,
      profileImage: "https://via.placeholder.com/50",
      url: `https://x.com/${newAccountUsername}`,
      savedAt: new Date().toISOString(),
      category: newAccountCategory,
      engagementRate: Math.round(Math.random() * 10 * 10) / 10,
      lastEngaged: new Date().toISOString(),
    };

    setAccounts([newAccount, ...accounts]);
    toast.success(`Added @${newAccountUsername} to favorites`);
    setNewAccountUsername("");
    setShowAddModal(false);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Liked Accounts</h1>
          <p className="text-muted-foreground mt-1">
            Save and manage your favorite X accounts for engagement
          </p>
        </div>
        <Button
          className="flex items-center gap-2"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="w-4 h-4" />
          Add Account
        </Button>
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Add Favorite Account</CardTitle>
                <CardDescription>Save an X account to your favorites</CardDescription>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-muted rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Username</label>
                <div className="flex items-center mt-1">
                  <span className="text-muted-foreground mr-2">@</span>
                  <input
                    type="text"
                    placeholder="username"
                    value={newAccountUsername}
                    onChange={(e) => setNewAccountUsername(e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg bg-background"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <select
                  value={newAccountCategory}
                  onChange={(e) => setNewAccountCategory(e.target.value)}
                  className="w-full mt-1 px-4 py-2 border rounded-lg bg-background"
                >
                  {CATEGORIES.filter(c => c !== "All").map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleAddAccount}
                >
                  Add Account
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                filter === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAccounts.length === 0 ? (
          <Card className="md:col-span-2">
            <CardContent className="pt-12 text-center pb-12">
              <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No accounts yet</h3>
              <p className="text-muted-foreground mb-6">
                Start saving your favorite accounts to engage with them
              </p>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="mr-2 w-4 h-4" />
                Add Your First Account
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredAccounts.map((account) => (
            <Card key={account.id} className="hover:shadow-lg transition">
              <CardContent className="pt-6">
                {/* Account Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={account.profileImage}
                      alt={account.displayName}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <div className="flex items-center gap-1">
                        <p className="font-semibold">{account.displayName}</p>
                        {account.verified && (
                          <span className="text-blue-500">✓</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        @{account.username}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(account.id)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>

                {/* Bio */}
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {account.bio}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4 py-3 border-y">
                  <div className="text-center">
                    <p className="text-lg font-bold">
                      {formatNumber(account.followers)}
                    </p>
                    <p className="text-xs text-muted-foreground">Followers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">
                      {account.engagementRate}%
                    </p>
                    <p className="text-xs text-muted-foreground">Engagement</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">{account.category}</p>
                    <p className="text-xs text-muted-foreground">Category</p>
                  </div>
                </div>

                {/* Last Engaged */}
                <p className="text-xs text-muted-foreground mb-4">
                  Last engaged: {formatDate(account.lastEngaged)}
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() =>
                      window.open(account.url, "_blank")
                    }
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() =>
                      toast.info("Engage with this account - backend required")
                    }
                  >
                    <Heart className="w-4 h-4 mr-1" />
                    Engage
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {accounts.length}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Total Accounts
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">
                {formatNumber(
                  accounts.reduce((sum, a) => sum + a.followers, 0)
                )}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Combined Followers
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {(
                  accounts.reduce((sum, a) => sum + a.engagementRate, 0) /
                  accounts.length
                ).toFixed(1)}
                %
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Avg Engagement
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">
                {new Set(accounts.map((a) => a.category)).size}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Categories
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
