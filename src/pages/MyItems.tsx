import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import ItemCard from "@/components/ItemCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Check, X, Package, Plus, Eye } from "lucide-react";

export default function MyItems() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [myItems, setMyItems] = useState<any[]>([]);
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMyItems = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("items")
      .select("id, title, price, location, status, created_at, category_id, categories(name), item_images(image_url)")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false });
    setMyItems(data || []);
  }, [user]);

  const loadAdminPending = useCallback(async () => {
    if (!isAdmin) return;
    const { data } = await supabase
      .from("items")
      .select("*, categories(name), item_images(image_url)")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (!data) return;
    const sellerIds = [...new Set(data.map((i: any) => i.seller_id))];
    const { data: sellers } = await supabase.from("profiles").select("user_id, full_name, email").in("user_id", sellerIds);
    const sellerMap = new Map((sellers || []).map((s) => [s.user_id, s]));
    setPendingItems(data.map((item: any) => ({ ...item, seller: sellerMap.get(item.seller_id) })));
  }, [isAdmin]);

  useEffect(() => {
    Promise.all([loadMyItems(), loadAdminPending()]).finally(() => setLoading(false));
  }, [loadMyItems, loadAdminPending]);

  const approve = async (id: string) => {
    const { error } = await supabase.from("items").update({ status: "approved" as any }).eq("id", id);
    if (error) toast.error("Failed"); else { toast.success("Approved!"); loadAdminPending(); loadMyItems(); }
  };

  const reject = async (id: string) => {
    const { error } = await supabase.from("items").update({ status: "rejected" as any }).eq("id", id);
    if (error) toast.error("Failed"); else { toast.success("Rejected"); loadAdminPending(); loadMyItems(); }
  };

  const statusCounts = {
    all: myItems.length,
    pending: myItems.filter((i) => i.status === "pending").length,
    approved: myItems.filter((i) => i.status === "approved").length,
    sold: myItems.filter((i) => i.status === "sold").length,
  };

  return (
    <div className="container py-10 page-enter">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold">My Items</h1>
          <p className="text-muted-foreground mt-0.5">Track your listings and approvals</p>
        </div>
        <Button onClick={() => navigate("/sell")} className="gap-2">
          <Plus className="h-4 w-4" /> Sell Item
        </Button>
      </div>

      <Tabs defaultValue="listings">
        <TabsList className={isAdmin ? "grid w-full max-w-sm grid-cols-2" : ""}>
          <TabsTrigger value="listings">My Listings</TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="review" className="gap-2">
              Review
              {pendingItems.length > 0 && (
                <span className="h-5 w-5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                  {pendingItems.length}
                </span>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="listings" className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
              ))}
            </div>
          ) : myItems.length === 0 ? (
            <div className="py-24 text-center border-2 border-dashed rounded-2xl">
              <Package className="h-14 w-14 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="text-lg font-semibold mb-2">No listings yet</h3>
              <p className="text-muted-foreground text-sm mb-6">Start selling items to your campus peers!</p>
              <Button onClick={() => navigate("/sell")} className="gap-2">
                <Plus className="h-4 w-4" /> List Your First Item
              </Button>
            </div>
          ) : (
            <>
              {/* Status summary */}
              <div className="flex flex-wrap gap-3 mb-6">
                {[
                  { label: "Total", count: statusCounts.all, color: "secondary" as const },
                  { label: "Pending", count: statusCounts.pending, color: "warning" as const },
                  { label: "Live", count: statusCounts.approved, color: "success" as const },
                  { label: "Sold", count: statusCounts.sold, color: "sold" as const },
                ].map(({ label, count, color }) => (
                  <Badge key={label} variant={color} className="px-3 py-1 text-sm gap-1.5">
                    {count} {label}
                  </Badge>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {myItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    price={item.price}
                    location={item.location}
                    status={item.status}
                    created_at={item.created_at}
                    category_name={item.categories?.name}
                    image_url={item.item_images?.[0]?.image_url}
                  />
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {isAdmin && (
          <TabsContent value="review" className="mt-6">
            {pendingItems.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                <Check className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">All caught up!</p>
                <p className="text-sm mt-1">No items waiting for review.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                        {item.item_images?.[0] ? (
                          <img src={item.item_images[0].image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-2xl">📦</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{item.title}</h3>
                        <p className="text-sm text-muted-foreground truncate mt-0.5">{item.description}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">₹{item.price}</span>
                          <span>•</span>
                          <span>{item.location}</span>
                          {item.categories && <Badge variant="secondary" className="text-xs">{item.categories.name}</Badge>}
                          <span>•</span>
                          <span>by {item.seller?.full_name || item.seller?.email}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/item/${item.id}`)} title="View">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" onClick={() => approve(item.id)} className="gap-1 bg-emerald-600 hover:bg-emerald-700">
                          <Check className="h-4 w-4" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => reject(item.id)} className="gap-1">
                          <X className="h-4 w-4" /> Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
