import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-md animate-fade-up">
        {/* Illustration */}
        <div className="relative mx-auto mb-8 h-40 w-40">
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-8xl select-none">🔍</span>
          </div>
        </div>

        <h1 className="font-display text-6xl font-bold text-foreground mb-2">404</h1>
        <h2 className="font-display text-2xl font-semibold mb-3">Page Not Found</h2>
        <p className="text-muted-foreground leading-relaxed mb-8">
          Looks like this page swapped away. The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Button onClick={() => navigate("/")} className="gap-2">
            <Search className="h-4 w-4" />
            Browse Marketplace
          </Button>
        </div>
      </div>
    </div>
  );
}
