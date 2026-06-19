"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  FileText,
  Zap,
  Calendar,
  Image,
  Settings,
  LogOut,
  Menu,
  X,
  Users,
} from "lucide-react";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: BarChart3 },
  { name: "Posts", href: "/dashboard/posts", icon: FileText },
  { name: "Studio", href: "/dashboard/studio", icon: Zap },
  { name: "Calendar", href: "/dashboard/calendar", icon: Calendar },
  { name: "Media", href: "/dashboard/media", icon: Image },
];

const settingsNavigation = [
  { name: "Teams", href: "/dashboard/teams", icon: Users },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-card border"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:relative w-64 h-screen bg-card border-r flex flex-col transition-all duration-300 z-40",
          !isOpen && "hidden md:flex -translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo */}
        <Link href="/" className="p-6 border-b">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            ContentFlow
          </h1>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6">
          <div className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <Link key={item.href} href={item.href}>
                  <button
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-muted-foreground"
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.name}</span>
                  </button>
                </Link>
              );
            })}
          </div>

          <div className="border-t pt-4 space-y-2">
            <p className="text-xs uppercase font-semibold text-muted-foreground px-4">
              Settings
            </p>
            {settingsNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <Link key={item.href} href={item.href}>
                  <button
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-muted-foreground"
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.name}</span>
                  </button>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t">
          <Button
            onClick={() => signOut()}
            variant="outline"
            className="w-full justify-start gap-3"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </Button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
