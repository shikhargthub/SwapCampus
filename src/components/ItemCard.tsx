import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Heart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { formatPrice } from "@/lib/utils";
import { memo, useState } from "react";

interface ItemCardProps {
  id: string;
  title: string;
  price: number;
  location: string;
  status: string;
  created_at: string;
  category_name?: string;
  image_url?: string;
}

const categoryEmoji: Record<string, string> = {
  Electronics: "💻", Books: "📚", Stationery: "✏️", Furniture: "🪑",
  Clothing: "👕", Sports: "⚽", Food: "🍕", Transport: "🚲",
  Notes: "📓", Other: "📦",
};

const ItemCard = memo(function ItemCard({
  id, title, price, location, status, created_at, category_name, image_url,
}: ItemCardProps) {
  const [liked, setLiked] = useState(false);
  const isNew = Date.now() - new Date(created_at).getTime() < 1000 * 60 * 60 * 24;

  const statusBadge = (() => {
    if (status === "pending") return <Badge variant="warning">⏳ Pending</Badge>;
    if (status === "rejected") return <Badge variant="destructive">❌ Rejected</Badge>;
    if (status === "sold") return <Badge variant="sold">✅ Sold</Badge>;
    return null;
  })();

  return (
    <Link to={`/item/${id}`} className="group block">
      <article className="rounded-2xl border bg-card overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 hover:border-primary/20">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {image_url ? (
            <img
              src={image_url}
              alt={title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <div className="text-center text-muted-foreground/50">
                <div className="text-5xl mb-1">
                  {categoryEmoji[category_name || ""] || "📦"}
                </div>
                <p className="text-xs">No image</p>
              </div>
            </div>
          )}

          {/* Sold overlay */}
          {status === "sold" && (
            <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center">
              <span className="bg-foreground text-background text-xs font-bold px-4 py-2 rounded-full tracking-widest uppercase shadow-lg">
                Sold Out
              </span>
            </div>
          )}

          {/* Top badges row */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between">
            {category_name && (
              <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm text-xs shadow-sm gap-1">
                {categoryEmoji[category_name] && <span>{categoryEmoji[category_name]}</span>}
                {category_name}
              </Badge>
            )}
            {isNew && !category_name && (
              <Badge className="bg-emerald-500 text-white text-xs border-0">✨ New</Badge>
            )}
            {isNew && category_name && (
              <Badge className="bg-emerald-500 text-white text-xs border-0">New</Badge>
            )}
          </div>

          {/* Like button */}
          <button
            onClick={(e) => { e.preventDefault(); setLiked(!liked); }}
            className={`absolute bottom-2.5 right-2.5 p-1.5 rounded-full transition-all duration-200 ${
              liked
                ? "bg-red-500 text-white shadow-lg scale-110"
                : "bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-red-500 hover:bg-background"
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-semibold text-sm leading-snug line-clamp-2 flex-1 group-hover:text-primary transition-colors">
              {title}
            </h3>
            <span className="font-display font-bold text-primary text-base whitespace-nowrap">
              {formatPrice(price)}
            </span>
          </div>

          {statusBadge && <div className="mb-2">{statusBadge}</div>}

          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2.5 pt-2.5 border-t border-border/50">
            <span className="flex items-center gap-1 min-w-0">
              <MapPin className="h-3 w-3 shrink-0 text-primary/60" />
              <span className="truncate">{location}</span>
            </span>
            <span className="flex items-center gap-1 shrink-0 ml-auto">
              <Clock className="h-3 w-3 text-muted-foreground/60" />
              {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
});

export default ItemCard;