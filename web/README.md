# TranscriptDock web

Next.js 15 App Router frontend for TranscriptDock.

```bash
npm install
cp .env.example .env.local
npm run dev      # http://localhost:3000
npm run lint
npm run typecheck
npm run build
```

The browser only calls same-origin `/api/*` routes. Those route handlers attach
the Supabase access token server-side and forward to the FastAPI backend at
`API_ORIGIN` (default `http://127.0.0.1:8000`). Start the API from `../api`.

Key paths:

- `app/(marketing)/` — landing, pricing, FAQ, how-it-works, legal pages
- `app/single`, `app/playlist` — transcript workflows
- `app/dashboard`, `app/settings` — protected account area (middleware)
- `app/api/` — BFF route handlers
- `components/ui/` — neo-brutalist primitives
- `lib/urls.ts` — client-side mirror of the backend URL allowlist

See the repository root `README.md` for architecture, Supabase setup and
deployment. All transcripts in this build are labelled demo data.
