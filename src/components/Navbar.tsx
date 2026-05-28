import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeftRight, Plus, MessageSquare, Shield, LogOut, Package, User,
} from "lucide-react";

// ── Unread count hook ─────────────────────────────────────────────────────────
function useUnreadCount() {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchUnread = async () => {
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("read", false);
      setUnread(count ?? 0);
    };

    fetchUnread();

    // Realtime: auto-update when new message arrives
    const channel = supabase
      .channel("navbar-unread")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `receiver_id=eq.${user.id}` },
        () => fetchUnread()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return unread;
}

// ── Badge component ───────────────────────────────────────────────────────────
function UnreadBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="absolute -top-1.5 -right-1.5 min-w-[17px] h-[17px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none shadow-sm ring-2 ring-background">
      {count > 9 ? "9+" : count}
    </span>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────────
export default function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const unreadCount = useUnreadCount();

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : (profile?.email?.[0] ?? "?").toUpperCase();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-xl shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-500 shadow-sm group-hover:shadow-glow group-hover:scale-105 transition-all duration-300">
            <ArrowLeftRight className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">
            Swap<span className="text-primary">Campus</span>
          </span>
        </Link>

        {user && (
          <nav className="hidden md:flex items-center gap-1">
            <NavItem to="/" active={isActive("/")}>🛍️ Marketplace</NavItem>
            <NavItem to="/my-items" active={isActive("/my-items")}>📦 My Items</NavItem>

            {/* Messages with unread badge */}
            <Link
              to="/chat"
              className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive("/chat")
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <span className="relative inline-flex items-center gap-1.5">
                <span className="relative">
                  💬
                  <UnreadBadge count={unreadCount} />
                </span>
                Messages
              </span>
            </Link>

            {isAdmin && <NavItem to="/admin" active={isActive("/admin")}>🛡️ Admin</NavItem>}
          </nav>
        )}

        {user && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="gradient"
              className="gap-1.5 hidden sm:inline-flex rounded-xl shadow-sm font-semibold"
              onClick={() => navigate("/sell")}
            >
              <Plus className="h-4 w-4" />
              Sell Item
            </Button>

            {/* Mobile: messages icon with badge */}
            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden relative"
              onClick={() => navigate("/chat")}
            >
              <MessageSquare className="h-4.5 w-4.5" />
              <UnreadBadge count={unreadCount} />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="rounded-full p-0.5 h-auto hover:bg-transparent focus-visible:ring-0">
                  <Avatar className="h-9 w-9 ring-2 ring-transparent hover:ring-primary/40 transition-all duration-200">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-emerald-500 text-white text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 shadow-elevated">
                <div className="px-3 py-3 bg-gradient-to-br from-primary/5 to-emerald-500/5 rounded-t-lg">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-emerald-500 text-white text-xs font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm leading-tight truncate">{profile?.full_name || "User"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{profile?.email}</p>
                    </div>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")} className="gap-2.5 cursor-pointer">
                  <User className="h-4 w-4 text-muted-foreground" /> My Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/my-items")} className="gap-2.5 cursor-pointer">
                  <Package className="h-4 w-4 text-muted-foreground" /> My Items
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/chat")} className="gap-2.5 cursor-pointer">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  Messages
                  {unreadCount > 0 && (
                    <span className="ml-auto min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/admin")} className="gap-2.5 cursor-pointer">
                      <Shield className="h-4 w-4 text-primary" /> Admin Panel
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="gap-2.5 text-destructive focus:text-destructive cursor-pointer">
                  <LogOut className="h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
}

function NavItem({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        active
          ? "bg-primary/10 text-primary shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
    >
      {children}
    </Link>
  );
}
