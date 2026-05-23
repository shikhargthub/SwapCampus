import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  ArrowRight,
  ShieldCheck,
  MessageCircle,
  ArrowLeftRight,
  Star,
  BookOpen,
  Laptop,
  Zap,
  Users,
  Bell,
  ChevronDown,
} from "lucide-react";

// ─── Marquee items ────────────────────────────────────────────────────────────
const previewItems = [
  { emoji: "📚", name: "Calculus Textbook", price: "₹350" },
  { emoji: "💻", name: "MacBook Charger", price: "₹800" },
  { emoji: "☕", name: "Coffee Maker", price: "₹1,200" },
  { emoji: "🎒", name: "Campus Backpack", price: "₹600" },
  { emoji: "🖥️", name: "Study Lamp", price: "₹250" },
  { emoji: "📓", name: "Engineering Notes", price: "₹150" },
  { emoji: "🎧", name: "Headphones", price: "₹900" },
  { emoji: "🔋", name: "Power Bank", price: "₹700" },
  { emoji: "📐", name: "Drawing Kit", price: "₹200" },
  { emoji: "🖨️", name: "Mini Printer", price: "₹2,500" },
];

// ─── Feature data ─────────────────────────────────────────────────────────────
const features = [
  {
    icon: <ShieldCheck className="h-6 w-6 text-emerald-500" />,
    bg: "from-emerald-500/10 to-emerald-500/5",
    border: "border-emerald-500/20",
    title: "Campus Verified",
    desc: "Sign up with your .edu college email. Only verified students from your campus can join — no random strangers.",
  },
  {
    icon: <ArrowLeftRight className="h-6 w-6 text-primary" />,
    bg: "from-primary/10 to-primary/5",
    border: "border-primary/20",
    title: "Buy, Sell & Swap",
    desc: "List items you don't need, find what you do, or propose a direct swap — no cash required.",
  },
  {
    icon: <MessageCircle className="h-6 w-6 text-sky-500" />,
    bg: "from-sky-500/10 to-sky-500/5",
    border: "border-sky-500/20",
    title: "Real-time Chat",
    desc: "Negotiate directly in-app with buyers and sellers. No personal info shared until you choose to.",
  },
  {
    icon: <Bell className="h-6 w-6 text-amber-500" />,
    bg: "from-amber-500/10 to-amber-500/5",
    border: "border-amber-500/20",
    title: "Watchlist Alerts",
    desc: "Save a search and get notified the moment a matching item appears in your campus feed.",
  },
  {
    icon: <Star className="h-6 w-6 text-pink-500" />,
    bg: "from-pink-500/10 to-pink-500/5",
    border: "border-pink-500/20",
    title: "Ratings & Reviews",
    desc: "Every swap builds your reputation. Trusted sellers get a verified badge visible campus-wide.",
  },
  {
    icon: <Users className="h-6 w-6 text-violet-500" />,
    bg: "from-violet-500/10 to-violet-500/5",
    border: "border-violet-500/20",
    title: "Community First",
    desc: "SwapCampus is 100% free. No fees, no ads, no middleman. Just students helping students.",
  },
];

// ─── How it works steps ───────────────────────────────────────────────────────
const steps = [
  {
    num: "01",
    icon: <BookOpen className="h-5 w-5" />,
    title: "Create your account",
    desc: "Sign up with your college email for instant campus verification. Takes under a minute.",
  },
  {
    num: "02",
    icon: <Laptop className="h-5 w-5" />,
    title: "Browse or list",
    desc: "Scroll your campus feed to find deals, or post your own item with a photo in 60 seconds.",
  },
  {
    num: "03",
    icon: <MessageCircle className="h-5 w-5" />,
    title: "Chat & close the deal",
    desc: "Message the seller, agree on a price or swap, pick a campus spot, and meet up safely.",
  },
];

// ─── Testimonials ─────────────────────────────────────────────────────────────
const testimonials = [
  {
    name: "Aarav S.",
    college: "IIT Kanpur",
    avatar: "AS",
    text: "Sold my old DSA book within 2 hours of listing. SwapCampus is insanely fast for campus trades.",
  },
  {
    name: "Priya M.",
    college: "NIT Allahabad",
    avatar: "PM",
    text: "Swapped my graphics tablet for a mechanical keyboard — no money exchanged. This is genius.",
  },
  {
    name: "Rohan K.",
    college: "BITS Pilani",
    avatar: "RK",
    text: "The campus-only thing makes it so much safer than random Facebook groups. Highly recommend.",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const goToApp = () => navigate(user ? "/" : "/auth");

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">

      {/* ── Sticky Nav ─────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center shadow-sm">
              <ArrowLeftRight className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold">
              Swap<span className="text-primary">Campus</span>
            </span>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Reviews</a>
          </nav>

          {/* Auth buttons */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
              Sign in
            </Button>
            <Button size="sm" className="rounded-lg" onClick={goToApp}>
              Get started
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-16 md:pt-44 md:pb-28 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-20 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px]" />
          <div className="absolute -bottom-20 -right-20 w-[500px] h-[500px] bg-emerald-400/10 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[80px]" />
        </div>

        <div className="container text-center">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 text-sm font-medium rounded-full bg-primary/10 text-primary border border-primary/20 animate-fade-in">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Student-first campus exchange platform</span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6 animate-fade-up">
            Buy, Sell & Swap<br />
            <span className="text-gradient">within your Campus</span>
          </h1>

          <p
            className="max-w-xl mx-auto text-lg md:text-xl text-muted-foreground mb-10 animate-fade-up"
            style={{ animationDelay: "0.1s" }}
          >
            Trade books, tech, notes, and gear with verified peers at your university.
            Safe, local, and completely free — always.
          </p>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up"
            style={{ animationDelay: "0.2s" }}
          >
            <Button
              size="lg"
              variant="gradient"
              className="w-full sm:w-auto h-12 px-8 rounded-xl text-base font-semibold shadow-glow"
              onClick={goToApp}
            >
              {user ? "Open Marketplace" : "Join for Free"}
              <ArrowRight className="ml-1 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto h-12 px-8 rounded-xl text-base"
              onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}
            >
              See how it works
              <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </div>

          {/* Stats */}
          <div
            className="flex flex-wrap items-center justify-center gap-8 mt-14 animate-fade-up"
            style={{ animationDelay: "0.3s" }}
          >
            {[
              { n: "100%", label: "Free forever" },
              { n: ".edu", label: "Email verified" },
              { n: "Real-time", label: "Chat & deals" },
              { n: "Campus-only", label: "Safe & local" },
            ].map(({ n, label }) => (
              <div key={label} className="text-center">
                <div className="font-display text-2xl font-bold text-foreground">{n}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Scrolling marquee ──────────────────────────────────────────────── */}
      <section className="py-8 bg-muted/40 border-y border-border/50 overflow-hidden">
        <div className="flex gap-4 animate-marquee whitespace-nowrap">
          {[...previewItems, ...previewItems].map((item, i) => (
            <div
              key={i}
              className="inline-flex items-center gap-3 bg-card rounded-xl px-4 py-3 border shadow-sm flex-shrink-0"
            >
              <span className="text-2xl">{item.emoji}</span>
              <div>
                <p className="text-sm font-semibold">{item.name}</p>
                <p className="text-xs text-primary font-medium">{item.price}</p>
              </div>
            </div>
          ))}
        </div>
        <style>{`
          @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
          .animate-marquee { animation: marquee 30s linear infinite; }
        `}</style>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 container scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
            Why SwapCampus
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Everything you need to swap smart
          </h2>
          <p className="text-muted-foreground text-lg">
            Built with students in mind — safe, fast, and genuinely useful.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon, bg, border, title, desc }) => (
            <div
              key={title}
              className={`p-7 rounded-2xl border bg-gradient-to-br ${bg} ${border} hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 group`}
            >
              <div className="mb-4 inline-flex p-3 rounded-xl bg-background/80 border shadow-sm group-hover:scale-110 transition-transform duration-300">
                {icon}
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────────── */}
      <section id="how" className="py-20 bg-muted/40 border-y border-border/50 scroll-mt-20">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
              Simple process
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold">
              Get started in 3 steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto relative">
            {/* Connector line on desktop */}
            <div className="hidden md:block absolute top-10 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-border" />

            {steps.map(({ num, icon, title, desc }, idx) => (
              <div key={num} className="flex flex-col items-center text-center relative">
                <div className="w-16 h-16 rounded-2xl bg-background border-2 border-primary/30 text-primary font-display font-bold flex items-center justify-center mb-5 shadow-sm z-10">
                  <div className="flex flex-col items-center leading-none">
                    <span className="text-xs text-muted-foreground font-medium">{num}</span>
                    {icon}
                  </div>
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                {idx < steps.length - 1 && (
                  <ArrowRight className="md:hidden mt-6 h-5 w-5 text-muted-foreground rotate-90" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────────────────── */}
      <section id="testimonials" className="py-24 container scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
            Student voices
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold">
            Loved by students across campuses
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map(({ name, college, avatar, text }) => (
            <div
              key={name}
              className="p-6 rounded-2xl bg-card border hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 flex flex-col gap-4"
            >
              {/* Stars */}
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">"{text}"</p>
              <div className="flex items-center gap-3 pt-2 border-t border-border/50">
                <div className="w-9 h-9 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold">{name}</p>
                  <p className="text-xs text-muted-foreground">{college}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────────── */}
      <section className="py-24 container">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary/20 via-background to-emerald-500/10 border border-primary/20 p-12 md:p-20 text-center">
          {/* Background blobs inside card */}
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-emerald-400/20 rounded-full blur-[80px]" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
            <Zap className="h-3.5 w-3.5 fill-current" />
            Free forever · No credit card needed
          </div>

          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Ready to start swapping?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
            Join thousands of students already buying and selling on their campus.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              variant="gradient"
              className="h-12 px-10 rounded-xl text-base font-semibold shadow-glow"
              onClick={goToApp}
            >
              Join SwapCampus — It's Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-8 rounded-xl text-base"
              onClick={() => navigate("/auth")}
            >
              Sign in instead
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t py-10">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center">
              <ArrowLeftRight className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-display font-bold text-foreground">SwapCampus</span>
          </div>
          <p>© {new Date().getFullYear()} SwapCampus. Made with ❤️ for students.</p>
          <div className="flex gap-5">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
            <button onClick={() => navigate("/auth")} className="hover:text-foreground transition-colors">Sign in</button>
          </div>
        </div>
      </footer>
    </div>
  );
}