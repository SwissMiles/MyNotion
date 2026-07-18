# Cloud setup: login + real database (free)

MyNotion now supports sign-in with **Google or GitHub** (via [Clerk](https://clerk.com)) and stores
your data in a real hosted Postgres database (via [Supabase](https://supabase.com)). Both have
generous free tiers — no credit card needed.

A quick note on "hosting the database on GitHub": GitHub can host the **app** for free
(GitHub Pages), but it cannot host a database. Supabase hosts the database for free instead;
your data lives in their Postgres, protected so each user can only read/write their own row.

Without any configuration the app still runs exactly as before: local-only, data in the
browser's localStorage. The steps below take about 15 minutes.

---

## 1. Create the Clerk app (login)

1. Go to <https://dashboard.clerk.com> and sign up (free).
2. **Create application** → name it `MyNotion`.
3. Under sign-in options enable **Google** and **GitHub** only.
   Disable **Email**, **Phone**, **Username** and **Password** so there is no password login:
   *Configure → User & authentication → Email, phone, username* — turn everything off;
   *Configure → SSO connections* — make sure Google and GitHub are on.
4. Copy the **Publishable key** from *Configure → API keys*
   (looks like `pk_test_…`). You'll need it in step 4.

The in-app sign-in screen only offers Google/GitHub buttons anyway, but disabling the other
methods in Clerk keeps the account portal consistent.

## 2. Create the Supabase project (database)

1. Go to <https://supabase.com/dashboard> and sign up (free).
2. **New project** → name it `mynotion`, pick a region near you, generate a database password
   (you won't need it for the app — it's for direct DB admin access).
3. When the project is ready, open *Project Settings → API* and copy:
   - **Project URL** (`https://xxxx.supabase.co`)
   - **anon / public key**

### Create the table

Open *SQL Editor → New query*, paste the contents of [`supabase/schema.sql`](../supabase/schema.sql)
and click **Run**. This creates the `app_state` table with row-level security so each signed-in
user can only access their own data.

## 3. Connect Clerk to Supabase

This lets Supabase trust Clerk's login tokens:

1. In the **Clerk dashboard**: *Configure → Integrations → Supabase* → activate the integration.
   It shows your **Clerk domain** (e.g. `https://xxxx.clerk.accounts.dev`) — copy it.
2. In the **Supabase dashboard**: *Authentication → Sign In / Providers → Third Party Auth* →
   **Add integration → Clerk** → paste the Clerk domain.

## 4. Configure the app

```bash
cp .env.example .env.local
```

Fill in `.env.local` (it is git-ignored, keys never get committed):

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_…      # from step 1
VITE_SUPABASE_URL=https://xxxx.supabase.co # from step 2
VITE_SUPABASE_ANON_KEY=eyJ…                # from step 2
```

Then `npm run dev`, open the app, and sign in with Google or GitHub. 🎉

## How syncing works

- On sign-in the app loads your data from Supabase. If you had existing local data and no
  cloud copy yet (first sign-in), the local data is uploaded automatically.
- Every change is saved to Supabase about a second after you stop typing
  (a small "Saving…" badge appears bottom-right).
- localStorage is kept as a per-user offline cache, and Export/Import backups still work.
- If both the cloud and this device have data, **the cloud copy wins** on load — so always
  let the app finish loading before editing on a new device.

## Deploying for free

The app is a static site, so you can host it for free on GitHub Pages, Netlify, Vercel or
Cloudflare Pages. Remember to:

1. Set the three `VITE_…` environment variables in the host's build settings
   (they are baked in at build time).
2. Add your production URL to Clerk: *Configure → Domains*.
3. When going to production in Clerk you'll create production instances of the Google/GitHub
   OAuth apps — Clerk's dashboard walks you through it.

## Free-tier limits (plenty for one student)

- **Clerk**: 10,000 monthly active users free.
- **Supabase**: 500 MB database, 2 projects free. Note: free projects are **paused after
  1 week of inactivity** — just open the Supabase dashboard and click "Restore" if that
  happens (data is kept). Using the app regularly keeps it active.
