import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, X, ImagePlus, Loader2 } from "lucide-react";

export default function SellItem() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "", description: "", price: "", location: "", categoryId: "",
  });
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    supabase.from("categories").select("id, name").order("name")
      .then(({ data }) => setCategories(data || []));
  }, []);

  const addFiles = useCallback((files: File[]) => {
    const allowed = files.filter((f) => f.type.startsWith("image/"));
    const remaining = 5 - images.length;
    if (remaining <= 0) { toast.error("Maximum 5 images allowed"); return; }
    const toAdd = allowed.slice(0, remaining);
    if (toAdd.length < files.length) toast.warning(`Only ${remaining} more image(s) allowed`);

    setImages((prev) => [...prev, ...toAdd]);
    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviews((p) => [...p, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
  }, [images]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files || []));
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const removeImage = (idx: number) => {
    setImages((p) => p.filter((_, i) => i !== idx));
    setPreviews((p) => p.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    if (!form.title.trim()) { toast.error("Item name is required"); return; }
    if (!form.price || Number(form.price) < 0) { toast.error("Please enter a valid price"); return; }
    if (!form.location.trim()) { toast.error("Pickup location is required"); return; }

    setSubmitting(true);
    try {
      const { data: item, error: itemErr } = await supabase
        .from("items")
        .insert({
          seller_id: user.id,
          title: form.title.trim(),
          description: form.description.trim() || null,
          price: parseFloat(form.price),
          location: form.location.trim(),
          category_id: form.categoryId || null,
          college_id: profile.college_id,
        })
        .select()
        .single();

      if (itemErr) throw itemErr;

      // Upload images in parallel
      await Promise.all(
        images.map(async (file, i) => {
          const ext = file.name.split(".").pop();
          const path = `${user.id}/${item.id}/${i}.${ext}`;
          const { error: uploadErr } = await supabase.storage.from("item-images").upload(path, file);
          if (uploadErr) throw uploadErr;
          const { data: { publicUrl } } = supabase.storage.from("item-images").getPublicUrl(path);
          await supabase.from("item_images").insert({ item_id: item.id, image_url: publicUrl, position: i });
        })
      );

      toast.success("Item listed! It will be visible after admin approval.", { duration: 5000 });
      navigate("/my-items");
    } catch (err: any) {
      toast.error(err.message || "Failed to list item. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="container max-w-2xl py-10 page-enter">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">List an Item</h1>
        <p className="text-muted-foreground mt-1">List your item for students at your campus</p>
      </div>

      <Card className="shadow-elevated">
        <CardContent className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Images */}
            <div className="space-y-3">
              <Label>Photos <span className="text-muted-foreground font-normal">(up to 5)</span></Label>
              <div
                className={`relative border-2 border-dashed rounded-xl p-4 transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <div className="flex flex-wrap gap-3">
                  {previews.map((src, i) => (
                    <div key={i} className="relative h-24 w-24 rounded-lg overflow-hidden border-2 border-border group">
                      <img src={src} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-5 w-5 text-white" />
                      </button>
                    </div>
                  ))}
                  {images.length < 5 && (
                    <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-primary/5 transition-all">
                      <ImagePlus className="h-6 w-6 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">Add photo</span>
                      <input type="file" accept="image/*" multiple onChange={handleImageChange} className="sr-only" />
                    </label>
                  )}
                </div>
                {images.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground mt-3">
                    Drag photos here or click to select
                  </p>
                )}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title">Item Name *</Label>
              <Input id="title" value={form.title} onChange={set("title")} required placeholder="e.g. Engineering Mathematics textbook" />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="desc">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea id="desc" value={form.description} onChange={set("description")} placeholder="Condition, edition, included accessories..." rows={3} />
            </div>

            {/* Price & Category */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="price">Price (₹) *</Label>
                <Input id="price" type="number" min="0" step="1" value={form.price} onChange={set("price")} required placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cat">Category</Label>
                <Select value={form.categoryId} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}>
                  <SelectTrigger id="cat"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <Label htmlFor="loc">Pickup Location *</Label>
              <Input id="loc" value={form.location} onChange={set("location")} required placeholder="e.g. Main library entrance, Hostel 5 gate" />
              <p className="text-xs text-muted-foreground">Where can buyers meet you on campus?</p>
            </div>

            <div className="pt-2 flex gap-3">
              <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-2 flex-grow-[2]" disabled={submitting}>
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Listing...</>
                ) : (
                  "List Item for Sale"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
