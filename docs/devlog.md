# Dev Log

---

## 2026-05-17 — ~2 hours

**Completed:**
- Docker + Docker Compose — frontend, backend, and PostgreSQL all run with `docker compose up -d`; hot reload works in both services via volume mounts; DB healthcheck ensures backend waits for Postgres before starting
- Fixed `requirements.txt` — `djangorestframework-simplejwt` was missing
- Updated all three READMEs with Docker workflow and accurate stack info
- Vercel deployment — frontend live with auto-deploy on push to `main`; `VITE_API_URL` env var replaces hardcoded localhost; `vercel.json` rewrite rule prevents React Router 404s on refresh
- Railway deployment — Django backend live at `garden-ai-production-6a57.up.railway.app`; managed Postgres on Railway; gunicorn + whitenoise for production serving; `dj-database-url` parses `DATABASE_URL` from Railway

**Next up:** User-facing features — move plant between beds, view all plants/beds across gardens

---

## 2026-05-16 — ~4 hours

**Completed:**
- Bed detail page at `/gardens/:id/beds/:bedId` — dedicated bookmarkable page per bed with full metadata and plant management
- Simplified bed cards on garden detail — clicking navigates to bed detail, edit/delete still accessible from dropdown
- Plant catalog picker — searchable by name, filterable by category pills, selected plant chip persists across filter switches
- Feature-based folder restructure for `/components` and `/pages`
- camelCase API responses via `djangorestframework-camel-case` — frontend types and schemas updated accordingly
- JWT token silent refresh on 401 — retries original request with new token, redirects to login if refresh fails
- PostgreSQL swap — replaced SQLite with PostgreSQL locally; environment variables managed via `python-decouple`
- Superuser setup via `DJANGO_SUPERUSER_*` env vars
- Garden cards made fully clickable (consistent with bed cards)
- `cursor: pointer` added globally for all buttons
- VS Code CSS linter warnings suppressed for Tailwind v4 at-rules

**Next up:** Docker + Docker Compose
