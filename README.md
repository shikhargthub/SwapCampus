# SwapCampus 🔄

Link  [Swap Campus](https://swap-campus.vercel.app)

> **The student-first campus marketplace** — Buy, sell, and swap items with verified peers at your university.

---

## ✨ Features

- 🎓 **Campus-verified** — Auto-detects college from your email domain
- 🛒 **Marketplace** — Browse approved listings with search, filter, and sort
- 📸 **Item Listings** — Multi-image upload with drag-and-drop
- 💬 **Real-time Chat** — Direct messaging between buyers and sellers (Supabase Realtime)
- 🛡️ **Admin Panel** — Approve/reject listings, manage categories and colleges
- 👤 **User Profiles** — Edit name, view stats
- 📱 **Fully Responsive** — Works great on mobile and desktop

---

## 🚀 Setup Guide

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd swapcampus
npm install
```

### 2. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and create a free project
2. Once ready, open **SQL Editor** and run the entire `supabase-schema.sql` file
3. This creates all tables, RLS policies, triggers, storage bucket, and seeds default categories

### 3. Add Environment Variables

```bash
cp .env.example .env
```

Open `.env` and fill in:

```env
# From Supabase Dashboard → Your Project → Settings → API
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-public-key>
```

> ⚠️ Use the **anon/public** key — NOT the service role key.

### 4. Add Your College

In Supabase Dashboard → Table Editor → `colleges`, add a row:

| name | email_domain |
|------|-------------|
| IIT Delhi | iitd.ac.in |

Or use the Admin Panel after creating your admin user (see Step 6).

### 5. Run the Dev Server

```bash
npm run dev
```

Visit `http://localhost:5173`

### 6. Create Your Admin User

1. Sign up with your college email at `/auth`
2. Confirm your email
3. In Supabase Dashboard → SQL Editor, run:

```sql
insert into public.user_roles (user_id, role)
values ('<paste-your-user-uuid-here>', 'admin');
```

Find your UUID in: Dashboard → Authentication → Users

Now sign in and visit `/admin` to manage everything.

---

## 📂 Project Structure

```
src/
├── components/
│   ├── ui/               # Reusable UI primitives (Button, Card, Input…)
│   ├── Navbar.tsx         # Top navigation bar
│   ├── ItemCard.tsx       # Marketplace listing card
│   └── ProtectedRoute.tsx # Auth guard wrapper
├── integrations/
│   └── supabase/
│       ├── client.ts      # ← PASTE YOUR API KEYS HERE
│       └── types.ts       # TypeScript DB types
├── lib/
│   ├── auth.tsx           # Auth context + profile loader
│   └── utils.ts           # cn(), formatPrice()
├── pages/
│   ├── Landing.tsx        # Public homepage
│   ├── Auth.tsx           # Sign in / Sign up
│   ├── Marketplace.tsx    # Browse listings
│   ├── ItemDetail.tsx     # Single item view
│   ├── SellItem.tsx       # Create listing
│   ├── MyItems.tsx        # My listings + admin review
│   ├── Chat.tsx           # Real-time messaging
│   ├── Profile.tsx        # User profile editor
│   ├── Admin.tsx          # Full admin dashboard
│   └── NotFound.tsx       # 404 page
└── App.tsx                # Router + providers
```

---

## 🔑 Where to Paste API Keys

| File | Variable | What to put |
|------|----------|-------------|
| `.env` | `VITE_SUPABASE_URL` | `https://<id>.supabase.co` |
| `.env` | `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJ...` (anon key) |

Both values are in: **Supabase Dashboard → Settings → API**

---

## 🏗️ Build for Production

```bash
npm run build
# Output is in /dist — deploy to Vercel, Netlify, or any static host
```

For Vercel: just connect your GitHub repo. Add the two env vars in Vercel's project settings.

---

## 🗄️ Database Tables

| Table | Purpose |
|-------|---------|
| `colleges` | Registered colleges with email domains |
| `categories` | Item categories |
| `profiles` | User profile data (extends auth.users) |
| `user_roles` | Admin/moderator roles |
| `items` | Marketplace listings |
| `item_images` | Images attached to items |
| `messages` | Real-time chat messages |

---

## 🤝 Contributing

PRs welcome! Please open an issue first to discuss major changes.

---

## 📄 License

MIT — free to use and modify.
