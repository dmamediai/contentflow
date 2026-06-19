"use client";

import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Bell, HelpCircle } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { useState, useEffect } from "react";

export function Header() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <header className="border-b bg-card px-8 py-4 flex items-center justify-between">
      {/* Left side - Title */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </Button>

        {/* Help */}
        <Button variant="ghost" size="icon">
          <HelpCircle size={20} />
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </Button>

        {/* User Avatar */}
        <div className="flex items-center gap-3 pl-4 border-l">
          <div className="text-right">
            <p className="font-medium text-sm">{session?.user?.name || "User"}</p>
            <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
            {getInitials(session?.user?.name)}
          </div>
        </div>
      </div>
    </header>
  );
}
