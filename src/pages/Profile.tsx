import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { User, Mail, GraduationCap, Shield, Save, Loader2 } from "lucide-react";

export default function Profile() {
  const { user, profile, isAdmin, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [college, setCollege] = useState<{ name: string; email_domain: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ listed: 0, sold: 0 });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      if (profile.college_id) {
        supabase
          .from("colleges")
          .select("name, email_domain")
          .eq("id", profile.college_id)
          .single()
          .then(({ data }) => setCollege(data));
      }
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("items")
      .select("status")
      .eq("seller_id", user.id)
      .then(({ data }) => {
        if (data) {
          setStats({
            listed: data.length,
            sold: data.filter((i) => i.status === "sold").length,
          });
        }
      });
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !fullName.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim(), updated_at: new Date().toISOString() })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated!");
      await refreshProfile();
    }
  };

  const initials = fullName
    ? fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : (profile?.email?.[0] ?? "?").toUpperCase();

  return (
    <div className="container max-w-2xl py-10 page-enter">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account information</p>
      </div>

      {/* Profile card */}
      <Card className="shadow-elevated mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-18 w-18 ring-4 ring-primary/20" style={{ height: 72, width: 72 }}>
              <AvatarFallback className="bg-gradient-to-br from-primary/80 to-emerald-500/80 text-white text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-xl font-bold">{profile?.full_name || "Your Name"}</h2>
                {isAdmin && (
                  <Badge className="gap-1">
                    <Shield className="h-3 w-3" /> Admin
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{profile?.email}</p>
              {college && (
                <p className="text-sm text-primary font-medium mt-1 flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5" />
                  {college.name}
                </p>
              )}
            </div>
          </div>

          <Separator className="my-5" />

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center rounded-xl bg-muted/50 p-4">
              <p className="text-2xl font-bold font-display text-foreground">{stats.listed}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Items Listed</p>
            </div>
            <div className="text-center rounded-xl bg-muted/50 p-4">
              <p className="text-2xl font-bold font-display text-foreground">{stats.sold}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Items Sold</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit form */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Edit Profile</CardTitle>
          <CardDescription>Update your display name</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground" /> Full Name
              </Label>
              <Input
                id="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email
              </Label>
              <Input value={profile?.email || ""} disabled className="bg-muted/50" />
              <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
            </div>

            {college && (
              <div className="space-y-1.5">
                <Label className="flex items-center gap-2">
                  <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" /> College
                </Label>
                <Input value={`${college.name} (@${college.email_domain})`} disabled className="bg-muted/50" />
                <p className="text-xs text-muted-foreground">College is auto-detected from your email.</p>
              </div>
            )}

            <Button type="submit" disabled={saving || !fullName.trim()} className="gap-2">
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="h-4 w-4" /> Save Changes</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
