import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeftRight, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = "loading" | "success" | "error";

export default function EmailConfirm() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // Supabase puts the token in the URL hash: #access_token=...&type=signup
    const hash = window.location.hash;

    if (hash && hash.includes("access_token")) {
      // Let Supabase process the hash automatically
      supabase.auth.getSession().then(({ data, error }) => {
        if (error || !data.session) {
          setErrorMsg(error?.message || "Confirmation failed. The link may have expired.");
          setStatus("error");
        } else {
          setStatus("success");
          // Auto-redirect to marketplace after 3 seconds
          setTimeout(() => navigate("/"), 3000);
        }
      });
    } else if (hash && hash.includes("error_description")) {
      // Parse error from hash
      const params = new URLSearchParams(hash.replace("#", "?"));
      setErrorMsg(
        decodeURIComponent(params.get("error_description") || "Confirmation failed.")
      );
      setStatus("error");
    } else {
      // No hash — maybe user navigated here directly
      setErrorMsg("No confirmation token found. Please check your email link.");
      setStatus("error");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background blobs */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-20 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-emerald-400/10 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center shadow-lg">
            <ArrowLeftRight className="h-7 w-7 text-white" />
          </div>
        </div>

        {/* Card */}
        <div className="bg-card border rounded-2xl p-8 shadow-sm text-center">

          {/* ── Loading ── */}
          {status === "loading" && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">
                Confirming your email…
              </h1>
              <p className="text-muted-foreground text-sm">
                Please wait while we verify your account.
              </p>
            </div>
          )}

          {/* ── Success ── */}
          {status === "success" && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Email Confirmed! 🎉
                </h1>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Your SwapCampus account is verified and ready to go.
                  You're being redirected to the marketplace…
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                <div className="bg-primary h-full rounded-full animate-[grow_3s_linear_forwards]" />
              </div>
              <style>{`
                @keyframes grow { from { width: 0% } to { width: 100% } }
              `}</style>

              <div className="flex flex-col gap-3 w-full mt-2">
                <Button
                  className="w-full rounded-xl"
                  onClick={() => navigate("/")}
                >
                  Go to Marketplace now →
                </Button>
              </div>

              <div className="mt-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 w-full">
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  ✅ Your campus email is verified. You'll only see listings from your university.
                </p>
              </div>
            </div>
          )}

          {/* ── Error ── */}
          {status === "error" && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Confirmation Failed
                </h1>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {errorMsg}
                </p>
              </div>

              <div className="flex flex-col gap-3 w-full mt-2">
                <Button
                  className="w-full rounded-xl"
                  onClick={() => navigate("/auth")}
                >
                  Back to Sign In
                </Button>
                <Button
                  variant="outline"
                  className="w-full rounded-xl"
                  onClick={() => navigate("/auth?resend=true")}
                >
                  Resend confirmation email
                </Button>
              </div>

              <p className="text-xs text-muted-foreground mt-2">
                Confirmation links expire after 24 hours.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          SwapCampus · Campus-only student marketplace
        </p>
      </div>
    </div>
  );
}
