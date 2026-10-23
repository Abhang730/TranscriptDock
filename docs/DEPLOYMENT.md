# Deployment guide

Free-first recommendation, verified against the code in this repository (not
against live platforms — quotas and terms change; check them before deploying).

| Component | Recommended | Why |
| --- | --- | --- |
| Frontend (`web/`) | **Vercel** (Hobby) | First-class Next.js App Router support. The app uses middleware, cookies and server route handlers, so a static-only host will not work. |
| Backend (`api/`) | **Google Cloud Run** | Runs the provided Dockerfile, scales to zero, has a free tier. |
| Auth + database | **Supabase** (Free) | Auth, Postgres and RLS in one project. |
| Payments | **Razorpay** Test Mode → live after KYC | Server-side order/verify/webhook flows already implemented. |

> Cloudflare Pages (static) is **not suitable** for this frontend: protected
> routes rely on cookie sessions and the `/api/*` route handlers need a Node
> runtime. Cloudflare Workers with an OpenNext adapter is a possible future
> option but is untested here.

## 1. Supabase

1. Create the project, then run `api/app/database/schema.sql` in the SQL editor.
2. Configure Auth site/redirect URLs:
   - `https://<frontend-domain>`
   - `https://<frontend-domain>/auth/callback`
3. Enable Google provider (see README §4).
4. Save the project URL, anon key, service-role key and JWT secret.

Free-tier caveats: projects pause after inactivity; the built-in email sender is
heavily rate-limited and should be replaced with SMTP before public sign-ups.

## 2. Backend on Cloud Run

```bash
cd api
gcloud builds submit --tag gcr.io/<PROJECT_ID>/transcriptdock-api

gcloud run deploy transcriptdock-api \
  --image gcr.io/<PROJECT_ID>/transcriptdock-api \
  --region asia-south1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --min-instances 0 \
  --max-instances 2 \
  --memory 512Mi \
  --set-env-vars APP_ENV=production,PROVIDER_NAME=demo,STORE_BACKEND=supabase,TRUST_PROXY_HEADERS=true \
  --set-secrets SUPABASE_URL=supabase-url:latest,SUPABASE_SERVICE_ROLE_KEY=supabase-service-key:latest,SUPABASE_JWT_SECRET=supabase-jwt-secret:latest,RAZORPAY_KEY_ID=razorpay-key-id:latest,RAZORPAY_KEY_SECRET=razorpay-key-secret:latest,RAZORPAY_WEBHOOK_SECRET=razorpay-webhook-secret:latest
```

Notes:

- `--allow-unauthenticated` is required for the BFF to call the API; the API
  enforces auth itself on protected routes.
- `TRUST_PROXY_HEADERS=true` is only safe because the service is reachable
  through Google's proxy. Do not enable it for a directly exposed server.
- With in-memory rate limiting, more than one instance weakens per-IP limits. If
  you scale out, add edge rate limiting (Cloud Armor / Cloudflare) or a shared
  store.
- Cold starts on the free tier add ~1–3 s to the first request.

## 3. Frontend on Vercel

1. Import the repository, set **Root Directory** to `web`.
2. Build command `npm run build`, output is handled by Next.js.
3. Environment variables (Production + Preview):

```dotenv
NEXT_PUBLIC_SITE_URL=https://<frontend-domain>
NEXT_PUBLIC_SUPPORT_EMAIL=<real support email>
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>   # server-only
API_ORIGIN=https://transcriptdock-api-xxxx.a.run.app
```

4. Deploy, then add the Vercel domain to Supabase redirect URLs and to the
   backend `CORS_ORIGINS` (comma-separated, no trailing slash).
5. Point the Razorpay webhook at `https://<frontend-domain>/api/payments/webhook`.

## 4. Environment matrix

| Variable | Where | Secret | Required |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | web | no | yes |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | web | no | for accounts |
| `SUPABASE_SERVICE_ROLE_KEY` | web (server) | **yes** | account deletion |
| `API_ORIGIN` | web (server) | no | yes |
| `SUPABASE_URL` / `SUPABASE_JWT_SECRET` | api | JWT secret yes | yes |
| `SUPABASE_SERVICE_ROLE_KEY` | api | **yes** | when `STORE_BACKEND=supabase` |
| `STORE_BACKEND` | api | no | yes (`memory` or `supabase`) |
| `RAZORPAY_KEY_ID` / `_KEY_SECRET` / `_WEBHOOK_SECRET` | api | yes | for payments |
| `CORS_ORIGINS` | api | no | yes |
| `FREE_CREDITS`, `PACK_CREDITS`, `*_BATCH_SIZE`, `PACK_PRICE_PAISE` | api | no | yes |
| `RETENTION_DAYS`, `JOB_RETENTION_DAYS` | api | no | yes |
| `TRUST_PROXY_HEADERS` | api | no | behind proxy |

## 5. Verification after deploy

```bash
# API health (should report provider=demo, authConfigured=true)
curl -s https://<api-domain>/v1/health

# Public config
curl -s https://<api-domain>/v1/config

# Frontend routes render
for p in / /pricing /faq /how-it-works /legal/privacy /legal/terms \
         /legal/acceptable-use /legal/refund /legal/contact /legal/cookie-notice; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://<frontend-domain>$p")
  echo "$code $p"
done

# Protected route redirects to sign-in
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://<frontend-domain>/dashboard

# Anonymous demo single job through the BFF
curl -s -X POST https://<frontend-domain>/api/jobs \
  -H 'Content-Type: application/json' \
  -d '{"mode":"single","url":"https://youtu.be/dQw4w9WgXcQ"}'
```

A `503` from `/api/jobs` means `API_ORIGIN` is wrong or the API is cold/unhealthy.

## 6. Rollback

- **Vercel:** *Deployments → previous deployment → Promote to Production*.
- **Cloud Run:** traffic is revision-based:
  ```bash
  gcloud run revisions list --service transcriptdock-api --region asia-south1
  gcloud run services update-traffic transcriptdock-api \
    --to-revisions <PREVIOUS_REVISION>=100 --region asia-south1
  ```
- **Database:** take a Supabase backup before schema changes. The schema uses
  `create table if not exists` and `create or replace function`, so re-running is
  safe, but destructive column changes are not automatic.
- Keep the previous container image tag so a rollback does not require a rebuild.

## 7. Cost control

- Supabase Free: pause the project when unused; watch database size (transcripts
  are the large rows) and the 30-day retention purge.
- Cloud Run: `--max-instances 2`, 512 MiB, request timeout default 300 s (job
  processing is bounded: 15 s per item, 3 concurrent).
- Vercel Hobby: personal/non-commercial use only. A commercial launch needs a
  paid plan or another host — verify current terms.
- Razorpay charges per transaction; the ₹49 pack is a one-time purchase with no
  recurring billing.
- Nothing here guarantees a permanently free public SaaS. Domain, email (SMTP),
  and paid tiers are real costs once you leave demo mode.

## 8. Known deployment limitations

- Demo provider only: real transcription requires an authorized provider and a
  new implementation of `TranscriptProvider`.
- Supabase/Google/Razorpay flows are code-complete but unverified without
  credentials.
- In-memory store is unsuitable for production (data loss on restart).
- No background queue: playlist processing runs in the API process. A restart
  mid-batch leaves items `pending`; the retry endpoint can resume them.
- Placeholder legal operator/contact details must be replaced.
