import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import ItemCard from "@/components/ItemCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, SlidersHorizontal, RefreshCw, Sparkles, TrendingUp, Package } from "lucide-react";

interface Item {
  id: string;
  title: string;
  price: number;
  location: string;
  status: string;
  created_at: string;
  category_id: string | null;
  categories: { name: string } | null;
  item_images: { image_url: string }[];
}

type SortKey = "newest" | "price_asc" | "price_desc";

export default function Marketplace() {
  const { profile, loading: authLoading } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    const [itemsRes, catsRes] = await Promise.all([
      supabase
        .from("items")
        .select("id, title, price, location, status, created_at, category_id, categories(name), item_images(image_url)")
        .eq("status", "approved")
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("id, name").order("name"),
    ]);
    setItems((itemsRes.data as unknown as Item[]) || []);
    setCategories(catsRes.data || []);
    if (!silent) setLoading(false);
    else setRefreshing(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => {
    let result = items;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((i) =>
        i.title.toLowerCase().includes(q) || i.location.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== "all") result = result.filter((i) => i.category_id === categoryFilter);
    if (sort === "price_asc") result = [...result].sort((a, b) => a.price - b.price);
    else if (sort === "price_desc") result = [...result].sort((a, b) => b.price - a.price);
    return result;
  }, [items, debouncedSearch, categoryFilter, sort]);

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-border border-t-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading your campus feed…</p>
        </div>
      </div>
    );
  }

  if (profile !== null && !profile?.college_id) {
    return (
      <div className="container py-24 text-center max-w-md mx-auto">
        <div className="text-7xl mb-6 animate-bounce">🎓</div>
        <h2 className="text-2xl font-bold mb-3">No college detected</h2>
        <p className="text-muted-foreground leading-relaxed">
          Your email domain isn't linked to a college yet. Ask your admin to add your college's email domain.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero banner */}
      <div className="relative overflow-hidden border-b border-border/50 bg-gradient-to-br from-primary/5 via-background to-emerald-500/5">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/8 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 right-1/4 w-56 h-56 bg-emerald-400/8 rounded-full blur-[60px]" />
        </div>
        <div className="container py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🛍️</span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {profile?.full_name ? `Hey ${profile.full_name.split(" ")[0]}!` : "Campus Feed"}
                </span>
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
                Campus <span className="text-gradient">Marketplace</span>
              </h1>
              <p className="text-muted-foreground mt-1.5 text-sm md:text-base">
                🏫 Browse items listed by students at your college
              </p>
            </div>

            {/* Stats pills */}
            <div className="flex gap-3 flex-wrap">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border shadow-sm">
                <Package className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Listed</p>
                  <p className="text-sm font-bold">{items.length} items</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border shadow-sm">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Active</p>
                  <p className="text-sm font-bold">Campus only</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadData(true)}
                disabled={refreshing}
                className="gap-2 rounded-xl"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6 page-enter">
        {/* Category quick filters */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                categoryFilter === "all"
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
              }`}
            >
              ✨ All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategoryFilter(c.id)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  categoryFilter === c.id
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {/* Search + Sort */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="🔍  Search items, locations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 rounded-xl border-border/60 bg-card shadow-sm focus:shadow-md transition-shadow"
            />
          </div>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="sm:w-44 h-11 rounded-xl">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">🕐 Newest First</SelectItem>
              <SelectItem value="price_asc">💰 Price: Low → High</SelectItem>
              <SelectItem value="price_desc">💎 Price: High → Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        {!loading && (
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{filtered.length}</span> item{filtered.length !== 1 ? "s" : ""} found
              {debouncedSearch && <span className="text-primary"> for "{debouncedSearch}"</span>}
            </p>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3 animate-pulse">
                <Skeleton className="aspect-[4/3] rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <div className="text-6xl mb-5">{debouncedSearch ? "🔍" : "📦"}</div>
            <p className="text-xl font-semibold mb-2">{debouncedSearch ? "No results found" : "No items yet"}</p>
            <p className="text-muted-foreground text-sm mb-6">
              {debouncedSearch ? `Try a different search term` : "Be the first to list something on your campus!"}
            </p>
            {!debouncedSearch && (
              <Button variant="gradient" onClick={() => window.location.href = "/sell"}>
                + List an Item
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((item, i) => (
              <div
                key={item.id}
                className="animate-fade-up"
                style={{ animationDelay: `${i * 0.04}s`, animationFillMode: "both" }}
              >
                <ItemCard
                  id={item.id}
                  title={item.title}
                  price={item.price}
                  location={item.location}
                  status={item.status}
                  created_at={item.created_at}
                  category_name={item.categories?.name}
                  image_url={item.item_images?.[0]?.image_url}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}