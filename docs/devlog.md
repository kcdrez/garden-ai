# Dev Log

---

## 2026-05-17 — ~1 hour

**Completed:**
- Extracted `CardActionsMenu` to `components/ui/card-actions-menu.tsx` — shared edit/delete dropdown; replaces ~15 lines of repeated `DropdownMenu` boilerplate in `GardenItem` and `BedItem`
- Extracted `bedHasDetails` utility to `src/lib/beds.ts` — replaces 4 copies of the inline `bed.facing || bed.avgSunlightHours != null || bed.soilType || bed.notes` condition; accepts optional `includeNotes` param for the compact (no-notes) variant
- Renamed `BedMeta` component → `BedDetails` and `bedHasMeta` → `bedHasDetails` across all files

**Next up:** Move a plant from one bed to another (PATCH `bed` field on UserPlant)

---

## 2026-05-17 — ~3 hours

**Completed:**
- View all beds page (`/beds`) — flat list grouped by garden; query key `['beds', 'all']`
- View all plants page (`/plants`) — flat list with status badges and links to bed/garden
- "Beds" and "Plants" nav links added
- Backend: `GET /api/beds/` and `GET /api/userplants/` flat-list endpoints; added `gardenName` to `GardenBedSerializer` and `bedName`, `gardenId`, `gardenName` to `UserPlantSerializer`
- `BedMeta` shared component — facing, sunlight, soil type, notes icon rows; `showNotes` prop for compact view
- `formatDimensions` and `facingLabel` extracted to `src/lib/beds.ts`
- TanStack Query cache wiring — all write mutations invalidate by prefix (`['beds']`, `['plants', 'user']`); `initialData` seeding across GardenDetail, BedDetail so navigating AllBeds → garden → bed detail makes zero extra API calls
- Eliminated three redundant API calls on bed detail mount: garden fetch (use `bed.gardenName` instead), per-bed plants fetch (seed from `['plants', 'user', 'all']`), plant catalog fetch (add `enabled: open` to `UserPlantDialog`)

**Next up:** Refactor card boilerplate — GardenItem, BedItem, and AllBeds cards share repeated structure; extract a shared card pattern

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
