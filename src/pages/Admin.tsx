import { useEffect, useState, useCallback } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Check, X, Plus, Trash2, Package, Tag, GraduationCap,
  Eye, BarChart3, Users, ShoppingBag,
} from "lucide-react";

export default function Admin() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [colleges, setColleges] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, sold: 0, users: 0 });
  const [newCatName, setNewCatName] = useState("");
  const [newCollegeName, setNewCollegeName] = useState("");
  const [newCollegeDomain, setNewCollegeDomain] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    const [itemsRes, catsRes, collegesRes, profilesRes] = await Promise.all([
      supabase
        .from("items")
        .select("*, categories(name), item_images(image_url)")
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
      supabase.from("colleges").select("*").order("name"),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
    ]);

    const allItems = itemsRes.data || [];

    // Fetch sellers
    const sellerIds = [...new Set(allItems.map((i: any) => i.seller_id))];
    const { data: sellers } = sellerIds.length
      ? await supabase.from("profiles").select("user_id, full_name, email").in("user_id", sellerIds)
      : { data: [] };
    const sellerMap = new Map((sellers || []).map((s) => [s.user_id, s]));

    const enriched = allItems.map((item: any) => ({ ...item, seller: sellerMap.get(item.seller_id) }));
    setItems(enriched);
    setCategories(catsRes.data || []);
    setColleges(collegesRes.data || []);
    setStats({
      total: allItems.length,
      pending: allItems.filter((i: any) => i.status === "pending").length,
      approved: allItems.filter((i: any) => i.status === "approved").length,
      rejected: allItems.filter((i: any) => i.status === "rejected").length,
      sold: allItems.filter((i: any) => i.status === "sold").length,
      users: profilesRes.count || 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => { if (isAdmin) loadData(); }, [isAdmin, loadData]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("items").update({ status: status as any }).eq("id", id);
    if (error) toast.error("Failed to update status");
    else { toast.success(`Item ${status}`); loadData(); }
  };

  const addCategory = async () => {
    if (!newCatName.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("categories").insert({ name: newCatName.trim() });
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Category added"); setNewCatName(""); loadData(); }
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Category deleted"); loadData(); }
  };

  const addCollege = async () => {
    if (!newCollegeName.trim() || !newCollegeDomain.trim()) {
      toast.error("Both name and domain are required");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("colleges").insert({
      name: newCollegeName.trim(),
      email_domain: newCollegeDomain.trim().replace("@", ""),
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("College added"); setNewCollegeName(""); setNewCollegeDomain(""); loadData(); }
  };

  const deleteCollege = async (id: string) => {
    const { error } = await supabase.from("colleges").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("College deleted"); loadData(); }
  };

  if (authLoading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="container py-10 page-enter">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage listings, categories, and colleges</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<ShoppingBag className="h-5 w-5" />} label="Total Items" value={stats.total} color="text-primary" />
        <StatCard icon={<Package className="h-5 w-5" />} label="Pending Review" value={stats.pending} color="text-amber-500" />
        <StatCard icon={<Check className="h-5 w-5" />} label="Live Listings" value={stats.approved} color="text-emerald-500" />
        <StatCard icon={<Users className="h-5 w-5" />} label="Total Users" value={stats.users} color="text-blue-500" />
      </div>

      <Tabs defaultValue="pending">
        <div className="overflow-x-auto">
          <TabsList className="mb-1">
            <TabsTrigger value="pending" className="gap-2">
              <Package className="h-4 w-4" />
              Pending
              {stats.pending > 0 && (
                <span className="h-5 w-5 flex items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold">
                  {stats.pending}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              <Check className="h-4 w-4" /> Approved ({stats.approved})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">
              <X className="h-4 w-4" /> Rejected ({stats.rejected})
            </TabsTrigger>
            <TabsTrigger value="sold" className="gap-2">
              Sold ({stats.sold})
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <Tag className="h-4 w-4" /> Categories
            </TabsTrigger>
            <TabsTrigger value="colleges" className="gap-2">
              <GraduationCap className="h-4 w-4" /> Colleges
            </TabsTrigger>
          </TabsList>
        </div>

        {(["pending", "approved", "rejected", "sold"] as const).map((status) => (
          <TabsContent key={status} value={status} className="mt-4">
            <ItemList
              items={items.filter((i) => i.status === status)}
              status={status}
              loading={loading}
              onApprove={(id) => updateStatus(id, "approved")}
              onReject={(id) => updateStatus(id, "rejected")}
              onPending={(id) => updateStatus(id, "pending")}
              onView={(id) => navigate(`/item/${id}`)}
            />
          </TabsContent>
        ))}

        <TabsContent value="categories" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Manage Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2">
                <Input
                  placeholder="New category name..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCategory()}
                  className="flex-1"
                />
                <Button onClick={addCategory} disabled={saving || !newCatName.trim()} className="gap-2 shrink-0">
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
              <div className="space-y-2">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)
                ) : categories.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No categories yet</p>
                ) : (
                  categories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between rounded-xl border bg-muted/30 px-4 py-3 hover:bg-muted/50 transition-colors">
                      <span className="font-medium text-sm">{cat.name}</span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => deleteCategory(cat.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="colleges" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Manage Colleges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="College name (e.g. IIT Delhi)"
                  value={newCollegeName}
                  onChange={(e) => setNewCollegeName(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Email domain (e.g. iitd.ac.in)"
                  value={newCollegeDomain}
                  onChange={(e) => setNewCollegeDomain(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={addCollege} disabled={saving || !newCollegeName.trim() || !newCollegeDomain.trim()} className="gap-2 shrink-0">
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
              <div className="space-y-2">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)
                ) : colleges.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No colleges yet. Add one to allow students to sign up!</p>
                ) : (
                  colleges.map((college) => (
                    <div key={college.id} className="flex items-center justify-between rounded-xl border bg-muted/30 px-4 py-3.5 hover:bg-muted/50 transition-colors">
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{college.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">@{college.email_domain}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => deleteCollege(college.id)}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Sub-components
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className={`${color} mb-2`}>{icon}</div>
        <p className="text-2xl font-bold font-display">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}

function ItemList({
  items, status, loading, onApprove, onReject, onPending, onView,
}: {
  items: any[];
  status: string;
  loading: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onPending: (id: string) => void;
  onView: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground border-2 border-dashed rounded-2xl">
        <p className="font-medium capitalize">No {status} items</p>
        <p className="text-sm mt-1">
          {status === "pending" ? "All caught up! 🎉" : `No items with status: ${status}`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-4">
            {/* Thumbnail */}
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
              {item.item_images?.[0] ? (
                <img src={item.item_images[0].image_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-xl">📦</div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{item.title}</h3>
              {item.description && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">{item.description}</p>
              )}
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">₹{item.price}</span>
                <span>•</span>
                <span>{item.location}</span>
                {item.categories && (
                  <Badge variant="secondary" className="text-xs">{item.categories.name}</Badge>
                )}
                <span>•</span>
                <span>by {item.seller?.full_name || item.seller?.email || "Unknown"}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 shrink-0 justify-end">
              <Button size="sm" variant="ghost" onClick={() => onView(item.id)} className="gap-1 text-muted-foreground">
                <Eye className="h-3.5 w-3.5" />
              </Button>
              {status !== "approved" && (
                <Button size="sm" onClick={() => onApprove(item.id)} className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white h-8">
                  <Check className="h-3.5 w-3.5" /> Approve
                </Button>
              )}
              {status !== "rejected" && (
                <Button size="sm" variant="destructive" onClick={() => onReject(item.id)} className="gap-1 h-8">
                  <X className="h-3.5 w-3.5" /> Reject
                </Button>
              )}
              {status !== "pending" && status !== "sold" && (
                <Button size="sm" variant="outline" onClick={() => onPending(item.id)} className="gap-1 h-8">
                  <Package className="h-3.5 w-3.5" /> Pending
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
