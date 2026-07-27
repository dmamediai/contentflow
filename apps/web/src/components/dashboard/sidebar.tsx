"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  Plug2,
  PenSquare,
  LayoutGrid,
  Layers,
  BarChart3,
  MessageSquare,
  Megaphone,
  Phone,
  Lock,
  Users,
  Webhook,
  Activity,
  SlidersHorizontal,
  MessageCircle,
  Star,
  Radio,
  Workflow,
  Contact,
  ChevronsUpDown,
  ChevronRight,
  Code2,
  ExternalLink,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { getInitials } from "@/lib/utils";

interface NavLeaf {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface NavItem extends NavLeaf {
  children?: NavLeaf[];
}

const navigation: NavItem[] = [
  { name: "Connections", href: "/dashboard/connections", icon: Plug2 },
  {
    name: "Posts",
    href: "/dashboard/posts",
    icon: PenSquare,
    children: [
      { name: "Overview", href: "/dashboard/posts", icon: LayoutGrid },
      { name: "Queues", href: "/dashboard/posts/queues", icon: Layers },
    ],
  },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  {
    name: "Inbox",
    href: "/dashboard/inbox",
    icon: MessageSquare,
    children: [
      { name: "Messages", href: "/dashboard/inbox/messages", icon: MessageCircle },
      { name: "Comments", href: "/dashboard/inbox/comments", icon: MessageSquare },
      { name: "Reviews", href: "/dashboard/inbox/reviews", icon: Star },
      { name: "Campaigns", href: "/dashboard/inbox/campaigns", icon: Radio },
      { name: "Workflows", href: "/dashboard/inbox/workflows", icon: Workflow },
      { name: "Contacts", href: "/dashboard/inbox/contacts", icon: Contact },
    ],
  },
  { name: "Ads", href: "/dashboard/ads", icon: Megaphone },
  { name: "Numbers", href: "/dashboard/numbers", icon: Phone },
  { name: "API Keys", href: "/dashboard/api-keys", icon: Lock },
  { name: "Users", href: "/dashboard/teams", icon: Users },
  { name: "Webhooks", href: "/dashboard/webhooks", icon: Webhook },
  { name: "Logs", href: "/dashboard/logs", icon: Activity },
  { name: "Settings", href: "/dashboard/settings", icon: SlidersHorizontal },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(
    navigation.find((item) => item.children && pathname.startsWith(item.href))?.name ?? null
  );

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-card border"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside
        className={cn(
          "fixed md:relative w-64 h-screen bg-card border-r flex flex-col transition-all duration-300 z-40",
          !isOpen && "hidden md:flex -translate-x-full md:translate-x-0"
        )}
      >
        {/* User block */}
        <button className="flex items-center gap-3 p-4 border-b text-left hover:bg-muted transition-colors">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm shrink-0 overflow-hidden">
            {session?.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt="" className="w-full h-full object-cover" />
            ) : (
              getInitials(session?.user?.name)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{session?.user?.name || "Account"}</p>
            <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
          </div>
          <ChevronsUpDown size={16} className="text-muted-foreground shrink-0" />
        </button>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const hasChildren = !!item.children;
            const isExpanded = expanded === item.name;

            return (
              <div key={item.href}>
                {hasChildren ? (
                  <button
                    onClick={() => setExpanded(isExpanded ? null : item.name)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm",
                      active && !isExpanded ? "bg-muted font-medium" : "hover:bg-muted text-muted-foreground",
                      isExpanded && "text-foreground"
                    )}
                  >
                    <Icon size={18} />
                    <span className="flex-1 text-left">{item.name}</span>
                    <ChevronRight
                      size={16}
                      className={cn("transition-transform", isExpanded && "rotate-90")}
                    />
                  </button>
                ) : (
                  <Link href={item.href} onClick={() => setIsOpen(false)}>
                    <div
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm",
                        active ? "bg-muted font-medium" : "hover:bg-muted text-muted-foreground"
                      )}
                    >
                      <Icon size={18} />
                      <span>{item.name}</span>
                    </div>
                  </Link>
                )}

                {hasChildren && isExpanded && (
                  <div className="ml-4 mt-1 space-y-1 border-l pl-3">
                    {item.children!.map((child) => {
                      const ChildIcon = child.icon;
                      const childActive = isActive(child.href);
                      return (
                        <Link key={child.href} href={child.href} onClick={() => setIsOpen(false)}>
                          <div
                            className={cn(
                              "flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-colors text-sm",
                              childActive
                                ? "bg-muted font-medium text-foreground"
                                : "hover:bg-muted text-muted-foreground"
                            )}
                          >
                            <ChildIcon size={16} />
                            <span>{child.name}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Free credits card */}
        <div className="px-3 pt-3">
          <div className="rounded-xl border bg-muted/40 px-4 py-3">
            <p className="text-xs text-muted-foreground">Free credits</p>
            <p className="text-lg font-bold text-green-600 dark:text-lime-400">$12.00</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 flex items-center gap-2">
          <a
            href="/docs/PUBLIC_API.md"
            target="_blank"
            rel="noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Code2 size={14} />
            Documentation
            <ExternalLink size={12} />
          </a>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-9 h-9 flex items-center justify-center rounded-full border hover:bg-muted transition-colors shrink-0"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={() => signOut()}
            className="w-9 h-9 flex items-center justify-center rounded-full border hover:bg-muted transition-colors shrink-0"
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 md:hidden z-30" onClick={() => setIsOpen(false)} />
      )}
    </>
  );
}
