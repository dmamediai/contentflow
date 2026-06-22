"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, Eye, Share2, Clock, X } from "lucide-react";
import { toast } from "sonner";

const DEMO_POSTS = [
  {
    id: "1",
    title: "Getting Started with Social Media",
    content: "Learn how to create amazing content for your social media...",
    status: "published",
    createdAt: "2024-06-15",
    views: 1250,
  },
  {
    id: "2",
    title: "10 Tips for Content Creators",
    content: "Discover the best practices for creating engaging content...",
    status: "scheduled",
    createdAt: "2024-06-14",
    views: 0,
  },
  {
    id: "3",
    title: "Why You Need a Social Strategy",
    content: "A comprehensive guide to building your social media strategy...",
    status: "draft",
    createdAt: "2024-06-13",
    views: 0,
  },
];

export default function PostsPage() {
  const [posts, setPosts] = useState(DEMO_POSTS);
  const [filter, setFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "", status: "draft" });

  const filteredPosts = filter === "all" ? posts : posts.filter((p) => p.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Posts</h1>
          <p className="text-muted-foreground">Manage all your social media posts</p>
        </div>
        <Button
          className="flex items-center gap-2"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4" />
          New Post
        </Button>
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Create New Post</CardTitle>
                <CardDescription>Write and schedule your post</CardDescription>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-muted rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Post Title</label>
                <input
                  type="text"
                  placeholder="Enter post title..."
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  className="w-full mt-1 px-4 py-2 border rounded-lg bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Content</label>
                <textarea
                  placeholder="Write your post content..."
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  rows={4}
                  className="w-full mt-1 px-4 py-2 border rounded-lg bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <select
                  value={newPost.status}
                  onChange={(e) => setNewPost({ ...newPost, status: e.target.value })}
                  className="w-full mt-1 px-4 py-2 border rounded-lg bg-background"
                >
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => {
                    if (!newPost.title || !newPost.content) {
                      toast.error("Please fill in all fields");
                      return;
                    }
                    const post = {
                      id: Math.random().toString(36).substr(2, 9),
                      title: newPost.title,
                      content: newPost.content,
                      status: newPost.status,
                      createdAt: new Date().toISOString().split('T')[0],
                      views: 0,
                    };
                    setPosts([post, ...posts]);
                    toast.success(`Post created as ${newPost.status}!`);
                    setShowCreateModal(false);
                    setNewPost({ title: "", content: "", status: "draft" });
                  }}
                >
                  Create Post
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        {["all", "published", "scheduled", "draft"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg transition capitalize ${
              filter === status
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Posts ({filteredPosts.length})</CardTitle>
          <CardDescription>View and manage all your posts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Title</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Created</th>
                  <th className="text-left py-3 px-4 font-semibold">Views</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="border-b hover:bg-muted/50 transition">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{post.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {post.content}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(post.status)}`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{post.createdAt}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-sm">
                        <Eye className="w-4 h-4" />
                        {post.views}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          className="p-2 hover:bg-muted rounded-lg transition"
                          onClick={() => toast.info("Edit post - backend required")}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 hover:bg-muted rounded-lg transition"
                          onClick={() => toast.info("Share post - backend required")}
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
                          onClick={() => toast.error("Delete post - backend required")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {posts.filter((p) => p.status === "published").length}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Published Posts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {posts.filter((p) => p.status === "scheduled").length}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Scheduled Posts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-600">
                {posts.filter((p) => p.status === "draft").length}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Draft Posts</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
