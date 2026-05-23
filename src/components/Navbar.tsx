import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeftRight, Plus, MessageSquare, Shield, LogOut, Package, User,
} from "lucide-react";

export default function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
            <NavItem to="/chat" active={isActive("/chat")}>💬 Messages</NavItem>
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

            <Button variant="ghost" size="icon-sm" className="md:hidden relative" onClick={() => navigate("/chat")}>
              <MessageSquare className="h-4.5 w-4.5" />
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
                  <MessageSquare className="h-4 w-4 text-muted-foreground" /> Messages
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