import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { MapPin, Clock, MessageSquare, CheckCircle, ArrowLeft, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { formatPrice } from "@/lib/utils";

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState<any>(null);
  const [images, setImages] = useState<string[]>([]);
  const [seller, setSeller] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from("items")
        .select("*, categories(name), item_images(image_url, position)")
        .eq("id", id)
        .single();
      if (data) {
        setItem(data);
        const imgs = [...(data.item_images as any[])]
          .sort((a, b) => a.position - b.position)
          .map((i: any) => i.image_url);
        setImages(imgs);
        const { data: s } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("user_id", data.seller_id)
          .single();
        setSeller(s);
      }
      setLoading(false);
    })();
  }, [id]);

  const handleMarkSold = async () => {
    const { error } = await supabase.from("items").update({ status: "sold" as any }).eq("id", id!);
    if (error) toast.error("Failed to mark as sold");
    else {
      toast.success("Item marked as sold!");
      setItem((i: any) => ({ ...i, status: "sold" }));
    }
  };

  if (loading) {
    return (
      <div className="container max-w-4xl py-10">
        <Skeleton className="h-8 w-32 mb-8" />
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container py-24 text-center">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-xl font-bold mb-2">Item not found</h2>
        <Button variant="outline" onClick={() => navigate("/")}>Back to Marketplace</Button>
      </div>
    );
  }

  const isSeller = user?.id === item.seller_id;
  const isSold = item.status === "sold";

  return (
    <div className="container max-w-4xl py-10 page-enter">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2 mb-6 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Images */}
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted border">
            {images.length > 0 ? (
              <img
                src={images[selectedImage]}
                alt={item.title}
                className="h-full w-full object-cover transition-opacity duration-200"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center text-muted-foreground/50">
                  <div className="text-6xl mb-2">📦</div>
                  <p className="text-sm">No photos</p>
                </div>
              </div>
            )}
            {isSold && (
              <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center">
                <span className="bg-foreground text-background text-sm font-bold px-5 py-2 rounded-full tracking-widest uppercase">Sold</span>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${i === selectedImage ? "border-primary ring-2 ring-primary/20" : "border-transparent opacity-70 hover:opacity-100"}`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-3">
            {item.categories && <Badge variant="secondary">{(item.categories as any).name}</Badge>}
            {item.status === "pending" && <Badge variant="warning">Pending Approval</Badge>}
            {isSold && <Badge variant="sold">Sold</Badge>}
          </div>

          <h1 className="font-display text-3xl font-bold mb-2">{item.title}</h1>
          <p className="text-3xl font-bold text-primary mb-4">{formatPrice(item.price)}</p>

          {item.description && (
            <p className="text-muted-foreground leading-relaxed mb-5">{item.description}</p>
          )}

          <div className="rounded-xl border bg-muted/40 p-4 space-y-3 text-sm mb-6">
            <div className="flex items-center gap-2.5">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{item.location}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>Listed {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
            </div>
            {seller && (
              <div className="flex items-center gap-2.5">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium">{seller.full_name || seller.email}</span>
              </div>
            )}
          </div>

          {!isSold && (
            <div className="flex gap-3 mt-auto">
              {!isSeller && (
                <Button
                  className="flex-1 gap-2"
                  onClick={() => navigate(`/chat?item=${id}&seller=${item.seller_id}`)}
                >
                  <MessageSquare className="h-4 w-4" />
                  Chat with Seller
                </Button>
              )}
              {isSeller && (
                <Button variant="outline" className="flex-1 gap-2" onClick={handleMarkSold}>
                  <CheckCircle className="h-4 w-4" />
                  Mark as Sold
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
