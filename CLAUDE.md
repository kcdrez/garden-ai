# Garden AI — Agent Context File

This file provides project-wide context. Stack, conventions, and tooling details live in the directory-level files:
- Frontend: `/frontend/CLAUDE.md`
- Backend: `/backend/CLAUDE.md`

---

# 📓 Dev Log

The dev log lives at `/docs/devlog.md`. It is the canonical record of what was built and what's next.

## Intention

A lightweight session journal — one entry per work session, focused on what shipped. Not a design doc or a bug tracker; just enough signal for an AI agent (or the developer) to orient quickly at the start of the next session.

## Format

```
## YYYY-MM-DD — ~N hours

**Completed:**
- Short bullet describing what shipped

**Next up:** One-line summary of what to tackle next
```

## Consumption (start of session)

At the start of every session, read the most recent devlog entry before doing anything else. Use it to:
- Understand what was just finished so you don't re-explain or redo it
- Pick up the **Next up** item as the default starting point if the user hasn't given a specific direction
- Cross-reference against the ✅ Completed list below if something seems missing

## Adding a new entry (end of session)

At the end of a session — or when the user asks — append a new dated entry to `/docs/devlog.md`. Rules:
- One entry per session, appended at the top (newest first)
- **Completed** bullets are high-level; skip internal refactors and tooling noise unless they unblock something
- **Next up** is a single line, not a list — the most important thing to tackle next
- After appending, cross-check the ✅ Completed list in this file and update it if anything is missing or stale

---

# 🧠 Project Overview

Garden AI is a full-stack web application for managing and visualizing home garden layouts and plant data.

The long-term goal is to evolve into a system that can:

- manage garden layouts
- track plant growth and placement
- provide gardening recommendations (potential AI features later)

## Purpose & Context

This is primarily a **portfolio project** built to deepen experience across the full stack and support a job search. It may grow into something more, but learning and demonstrable depth are the primary goals.

**The developer brings:**
- 10+ years of frontend experience (primarily Vue)
- ~1.5 years of Django backend experience
- Little to no DevOps experience

**Learning goals for this project:**
- React (TypeScript) — applying existing frontend expertise in a new ecosystem
- Full-stack development — owning the entire feature lifecycle end-to-end
- DevOps — hands-on experience with deployment, CI/CD, and cloud infrastructure (Vercel + AWS)

**Implications for AI agents:**
- React patterns and idioms are a learning surface — prefer explaining non-obvious choices rather than just implementing them
- Django patterns may be familiar but assume React/TypeScript idioms are being actively learned
- DevOps tooling should be introduced gradually with clear rationale; don't assume prior AWS/CI knowledge

---

# 📁 Repository Structure

/frontend  → React application (see /frontend/CLAUDE.md)
/backend   → Django REST API (see /backend/CLAUDE.md)
/docs      → Optional documentation
/CLAUDE.md → This file

---

# 🔐 Authentication

- Backend uses SimpleJWT for token-based auth
- Frontend stores tokens in localStorage and attaches via Axios interceptor
- All `/api/*` routes except auth endpoints require authentication
- Route protection is enforced via loader functions in the frontend router

---

# 🌱 Core Domain Model

Fields marked *(planned)* exist in the schema design but are not yet built.

### User *(extended)*
Django's default User plus:
- timezone *(planned)*
- locale *(planned)*

### Garden
- id: UUID or AutoField
- name: string (required)
- description: text (optional)
- location: string *(planned)*
- hardiness_zone: string *(planned)*
- timezone: string *(planned — IANA timezone name, e.g. "America/Denver"; when present, use this instead of the user's timezone for observation dates, since the garden's physical location is the correct reference point for "what day is it here")*
- length: positive integer (optional — required for garden-level grid layout; same unit as `unit` field)
- width: positive integer (optional — required for garden-level grid layout)
- unit: enum — `in`, `ft`, `cm`, `m` (default: ft; mirrors GardenBed.unit; required before BedPlacement can be built)
- created_at: datetime (auto)
- updated_at: datetime (auto)
- owner: ForeignKey(User)

### GardenBed
- id: UUID
- garden: ForeignKey(Garden)
- name: string (required)
- length: positive integer (required)
- width: positive integer (required)
- depth: positive integer (optional — wall height for raised beds)
- unit: enum — `in`, `ft`, `cm`, `m` (default: ft)
- facing: enum — `N`, `NE`, `E`, `SE`, `S`, `SW`, `W`, `NW` (optional)
- avg_sunlight_hours: positive integer 0–24 (optional)
- soil_type: string (optional — freeform, e.g. "loamy clay with amendments")
- notes: text (optional)
- created_at: datetime (auto)
- updated_at: datetime (auto)

### Plant
- id: UUID
- common_name: string
- scientific_name: string
- category: enum — `vegetable`, `herb`, `fruit`, `flower`, `other`
- description: text
- Global seeded catalog (41 plants); read-only via API (`GET /api/plants/`)

### UserPlant — plant placement in a bed
- id: UUID
- bed: ForeignKey(GardenBed)
- plant: ForeignKey(Plant)
- variety: string (optional — e.g. "Cherry Tomato")
- start_date: date (optional)
- status: enum — `planned`, `planted`, `growing`, `fruiting`, `dormant`, `removed`
- notes: text (optional)
- placement_id: UUID or null (read-only; UUID of the associated `PlantPlacement` if one exists)
- created_at / updated_at: datetime (auto)

**Move behaviour:** when `bed` is changed via PATCH, any existing `PlantPlacement` for this `UserPlant` is automatically deleted. The plant arrives in the new bed unplaced.

### PlantPlacement
Spatial placement of a `UserPlant` within a `GardenBed` grid. Decoupled from `UserPlant` so a plant can exist without a placement, and placement can be deleted/moved without touching the plant record.

- id: UUID
- user_plant: ForeignKey(UserPlant)
- bed: ForeignKey(GardenBed) — denormalized for easier querying; must match `user_plant.bed`
- x: integer — column (0-indexed); 1 cell = 1 square foot regardless of the bed's display unit
- y: integer — row (0-indexed)
- width: integer (default 1) — cells wide; supports plants that span multiple cells
- height: integer (default 1) — cells tall

**Unit normalization:** the grid always uses square feet as the cell unit. Bed dimensions are converted to feet at render time (`in ÷ 12`, `cm ÷ 30.48`, `m × 3.28084`), then rounded up to the nearest integer to get grid dimensions. This means a 240 cm × 120 cm bed and a 8 ft × 4 ft bed both render as an 8 × 4 grid. Odd dimensions (e.g. 66 in × 101 in) round up to the nearest foot; the last row/column is slightly smaller in reality but acceptable at this resolution.

**Grid resolution:** currently fixed at 1 ft × 1 ft per cell. The schema intentionally does not encode this assumption — `x`, `y`, `width`, `height` are plain integers whose meaning is set by the rendering layer. If sub-foot resolution is needed in the future (e.g. 6-inch cells for plants with 18-inch spacing), a single migration multiplies all stored values by a scale factor and the renderer is updated. No schema shape change required.

**Current constraint:** each `UserPlant` may have at most one `PlantPlacement`. Users who want to track multiple physical instances of the same variety should create separate `UserPlant` records. This is a deliberate simplification — see the design note below.

---

### UserPlant ↔ organism cardinality *(design decision — deferred)*
A `UserPlant` currently represents one logical plant entry (e.g., "Cherry Tomatoes"). In practice a gardener may plant 4 tomato seedlings in one bed — each could have independent observations (disease, harvest yield, death). Allowing multiple `PlantPlacement` records per `UserPlant` would expose this mismatch: which placement does a given observation belong to?

Options when this is revisited:
- Keep 1 UserPlant = 1 organism (current constraint); users duplicate records for multiples — simplest, no schema change
- Add a `quantity` field to UserPlant; observations remain at the UserPlant level (imprecise but pragmatic)
- Introduce an `Organism` or `PlantInstance` model as a child of UserPlant; observations attach to an instance — most expressive, most complex

Defer until harvest tracking or per-plant health tracking makes the limitation painful.

---

### Season *(planned)*
Groups planting activity by growing year/season. Enables crop rotation tracking and year-over-year comparisons. Without this, all UserPlants are a flat list scoped only by date, making rotation logic very difficult. Likely owned by a Garden.

### BedPlacement
Spatial placement of a `GardenBed` within a `Garden` grid. Mirrors the `PlantPlacement` model — same sq-ft grid convention, same x/y/width/height pattern — but one level up in the hierarchy.

- id: UUID
- bed: OneToOneField(GardenBed) — one placement per bed
- garden: ForeignKey(Garden) — denormalized; must match `bed.garden`
- x: integer — column (0-indexed, 1 cell = 1 sq ft)
- y: integer — row
- width: integer — derived from `bed.width` converted to feet (computed and sent by the frontend at create time)
- height: integer — derived from `bed.length` converted to feet

**Grid convention:** same sq-ft normalization as `PlantPlacement` — convert garden dimensions to feet at render time, round up. See `PlantPlacement` for the full unit conversion table.

**Resize protection:** `GardenSerializer.validate()` blocks resizing a garden if any existing `BedPlacement` would go out of bounds; `GardenBedSerializer.validate()` blocks resizing a bed if any existing `PlantPlacement` would go out of bounds. Errors surface as `non_field_errors` → `form.setError('root')` in the dialog.

---

### PlantVariety *(planned — design decision pending)*
Distinguishes cultivars ("Cherokee Purple", "Roma") from species ("Tomato"). Could be a field on `UserPlant` (simpler) or a separate model (required if AI or catalog features need variety-specific advice). Decide before building the plant catalog.

### Observation *(planned)*
A unified event log attached to a `UserPlant` or `GardenBed`. Covers pest sightings, watering notes, fertilizing events, and general journal entries — all share the same structure (date, note, type). Prevents proliferating separate models for each tracking feature.

### HarvestLog *(planned)*
Records individual harvest events with a quantity/weight measurement. Distinct from `Observation` because it's a measurement, not a note. Could fold into `Observation` with a type field, or stand alone — decide when building harvest tracking.

### Task *(planned)*
Reminders and to-dos optionally linked to a Garden, GardenBed, or UserPlant. Has a due date and a completed flag. The notification/scheduling side is handled by Celery (already planned).

### Photo *(planned)*
Generic image attachment linkable to multiple entity types (Garden, GardenBed, UserPlant). Implementation options: Django content type framework (`GenericForeignKey`) or explicit nullable FKs per entity — decide when building image uploads.

### AIConversation *(planned)*
- user: ForeignKey(User)
- prompt: text
- response: text

---

### Plant catalog ownership *(design decision)*
The `Plant` catalog is currently implied to be a global shared catalog (all users reference the same "Tomato" entry). This is the right default for AI features and companion planting data, but requires a curation/seeding strategy. A hybrid (global catalog + user-created custom varieties) is common but more complex — defer unless needed.

---

Ownership is enforced at the queryset level — users only see and modify their own gardens.

### Garden API contract

- `GET    /api/gardens/`                    → 200 `[{ id, name, description, created_at, updated_at, owner }]`
- `POST   /api/gardens/`                    → 201 `{ id, name, description, created_at, updated_at, owner }`
- `GET    /api/gardens/:id/`               → 200 `{ id, ... }`
- `PATCH  /api/gardens/:id/`               → 200 `{ id, ... }`
- `DELETE /api/gardens/:id/`               → 204

### GardenBed API contract

Nested under a garden — ownership enforced via the parent garden's owner check.

- `GET    /api/gardens/:id/beds/`          → 200 `[{ id, garden, name, length, width, depth, unit, facing, avg_sunlight_hours, soil_type, notes, created_at, updated_at }]`
- `POST   /api/gardens/:id/beds/`          → 201 `{ id, ... }`
- `GET    /api/gardens/:id/beds/:bedId/`   → 200 `{ id, ... }`
- `PATCH  /api/gardens/:id/beds/:bedId/`   → 200 `{ id, ... }`
- `DELETE /api/gardens/:id/beds/:bedId/`   → 204

### BedPlacement API contract

Nested under a garden. Requires garden to have `length`, `width`, and `unit` set.

- `GET    /api/gardens/:id/bed-placements/`                        → 200 `[{ id, bed, garden, x, y, width, height, created_at, updated_at }]`
- `POST   /api/gardens/:id/bed-placements/`                        → 201 `{ id, ... }`
- `DELETE /api/gardens/:id/bed-placements/:bedPlacementId/`        → 204

---

# 🌐 API Conventions

- Base URL: `/api/`
- Auth endpoints: `/api/auth/*`
- Responses are JSON
- Timestamps in ISO 8601 format
- All JSON field names are camelCase (e.g. `avgSunlightHours`, `createdAt`) — converted automatically by `djangorestframework-camel-case`. Django serializers and models remain snake_case; the conversion happens at the HTTP boundary.
- JWT access tokens expire in 5 minutes (SimpleJWT default). The frontend client silently refreshes using the stored refresh token on 401 and retries the original request.

---

# 🚧 Current Focus

> "Vertical Slice Development" — build full features end-to-end, avoid infrastructure work unless blocking, prioritize visible functionality over abstraction.

---

# 🏁 MVP Definition

The MVP is considered complete when:
- Users can create accounts and log in
- Users can manage gardens, beds, and plants
- AI recommendations are functional
- App is deployed publicly with HTTPS
- CI/CD pipeline is functional
- Dockerized local development works

---

# 🚫 Non-Goals

These are explicitly out of scope, at least initially:
- Kubernetes
- Microservices architecture
- Multi-tenant / enterprise support
- Complex AI agents or autonomous systems
- Real-time multiplayer collaboration
- Marketplace or ecommerce functionality

---

# ❌ Do NOT Do (for AI agents)

- Do not introduce new frameworks without explicit instruction
- Do not refactor architecture prematurely
- Do not add complex abstractions (CQRS, service layers, etc.)
- Do not add authentication complexity unless required
- Do not optimize prematurely

---

# ✅ Preferred AI Behavior

- Prefer small, incremental changes
- Preserve existing patterns unless broken
- Prioritize working end-to-end features
- Ask before introducing new dependencies
- Assume simplicity over scalability unless stated otherwise
- Follow the single responsibility principle — components and functions should do one thing; flag components that are growing too large and suggest splitting them rather than continuing to add to them

---

# 🌿 Features

## ✅ Completed

- User authentication (login/logout, JWT tokens, protected routes)
- User registration (`POST /api/auth/register/` — creates user and returns JWT tokens; frontend at `/register` with link from login page)
- Dark mode toggle (persisted to localStorage, synced with OS preference)
- Create, delete, and view multiple gardens
- Edit existing gardens (name and description, via inline dialog)
- Garden list as responsive card grid
- Field-level server error mapping on forms
- Garden detail page (`/gardens/:id`) — dedicated page per garden
- Garden bed CRUD — create, edit, delete beds nested under a garden; beds display name, dimensions, facing, sunlight, soil type, and notes on the card
- Abstract `BaseModel` in `core/` app — all models inherit `id` (UUID), `created_at`, `updated_at`
- Plant catalog (`GET /api/plants/`) — global seeded catalog of 41 common plants across vegetable, herb, fruit, flower, and other categories; read-only via API
- UserPlant CRUD — add, edit, delete plants within a garden bed (`/api/gardens/:id/beds/:bedId/plants/`); supports variety, planted date, status, and notes
- Garden bed detail page (`/gardens/:id/beds/:bedId`) — dedicated bookmarkable page per bed; shows full metadata (facing, sunlight, soil type, notes) and plant list with full CRUD; bed metadata editable via modal
- Plant catalog picker UI — replaces native select in the add/edit plant flow; searchable by name, filterable by category pills; selected plant shown as a persistent chip so context is clear when switching filters
- Bed cards on the garden detail page simplified to summary view — clicking the card navigates to the bed detail page; edit/delete still accessible from the card's dropdown
- camelCase API responses — `djangorestframework-camel-case` converts snake_case at the HTTP boundary; frontend types and Zod schemas updated to match
- JWT silent refresh — on 401, frontend retries the original request with a fresh token; redirects to login if refresh fails
- Feature-based folder structure for `/components` and `/pages` — organized by domain (gardens, plants, shared, etc.)
- PostgreSQL (local) — replaced SQLite with PostgreSQL; environment variables managed via `python-decouple`
- Docker + Docker Compose — full local dev stack (frontend, backend, PostgreSQL) runs with `docker compose up -d`; hot reload via volume mounts; DB healthcheck ensures startup order
- Vercel deployment — frontend live at `https://garden-ai-gamma.vercel.app`; auto-deploys on push to `main`; `VITE_API_URL` env var for backend URL; `vercel.json` rewrite rule for React Router SPA routing
- Railway deployment — Django backend live at `https://garden-ai-production-6a57.up.railway.app`; managed PostgreSQL on Railway; gunicorn + whitenoise for production serving; `dj-database-url` parses `DATABASE_URL`
- View all beds page (`/beds`) — flat list grouped by garden; `GET /api/beds/` flat-list endpoint; `gardenName` added to bed serializer
- View all plants page (`/plants`) — flat list with status badges and links to bed/garden; `GET /api/userplants/` flat-list endpoint; `bedName`, `gardenId`, `gardenName` added to user plant serializer
- `BedDetails` shared component — facing, sunlight, soil, notes icon rows; `showNotes` prop; `formatDimensions`/`facingLabel`/`bedHasDetails` extracted to `src/lib/beds.ts`
- TanStack Query cache optimization — prefix-based invalidation, `initialData` seeding across list→detail navigation; zero redundant API calls when navigating between all-beds, garden detail, and bed detail pages
- `CardActionsMenu` shared component in `components/ui/` — edit/delete/move dropdown; accepts `onEdit`, `onDelete`, `onMove` (optional), `isDeleting`, `label` props; used by `GardenItem`, `BedItem`, and plant lists
- Move plant between beds — PATCH `bed` field on `UserPlant`; `validate_bed` in serializer enforces target bed ownership; `MovePlantDialog` two-step wizard (pick bed or create a new one inline without stacking dialogs); wired into `BedDetail` and `AllPlants`
- Full edit/delete/move actions on `AllPlants` page — `UserPlantDialog` and `MovePlantDialog` both accessible from the list
- `NativeSelectField` custom chevron — `appearance-none` removes browser arrow; custom `ChevronDownIcon` absolutely positioned in a wrapper div; `pr-7` reserves space
- `Observation` model — tracks plant events; `user_plant` FK, `observed_date` (date), `type` enum (`status_change`, `harvest`, `pest`, `weather`, `disease`, `general`), `note`, `previous_status`, `new_status`; ordered chronologically; full CRUD API nested under UserPlant
- Auto-observation on status change — `UserPlantSerializer.create()`/`update()` creates a `status_change` observation using the user's local date derived from `UserProfile.timezone`
- `UserProfile` model — `timezone` CharField (default `UTC`), auto-created via `post_save` signal on User; `GET/PATCH /api/auth/profile/`; frontend sends browser timezone on login and register
- `dormant` and `fruiting` statuses — `harvested` removed (harvest is an observation event, not a status); `harvest` observation type added
- `planted_date` renamed to `start_date` on `UserPlant`; dialog label updated to "Start Date"
- `PlantTimeline` component — expandable per-plant section on bed detail; quick status chips, chronological history with type icons and alternating row shading, inline "Add Observation" form; manual `status_change` type for correcting erroneous auto-generated entries
- `PlantPlacement` model — `OneToOneField` → `UserPlant`, FK → `GardenBed`, `x/y/width/height`; sq-ft grid normalization; full CRUD API at `/api/gardens/:id/beds/:bedId/placements/`
- `BedGrid` component — 96px sq-ft grid on bed detail page; click empty cell to place a plant, hover occupied cell to remove; self-contained (owns placements query, mutations, `PlacePlantDialog`); shows loading state until placements are fetched to prevent stale unplaced list
- Docker migration hook — `PostToolUse` Bash hook auto-runs `docker compose exec backend python manage.py migrate` after any `makemigrations` command
- Garden dimensions — `length`, `width`, `unit` added to `Garden` model; shown on garden cards; prerequisite for `BedPlacement` grid view
- `bed_count` on `GardenSerializer`, `plant_count` on `GardenBedSerializer` — computed via `source="<related_manager>.count"`; shown on garden and bed cards
- `placement_id` on `UserPlantSerializer` — `SerializerMethodField` returning the UUID of the associated `PlantPlacement` or null; cascade delete of placement when `bed` changes
- Move plant fix — `UserPlantSerializer.update()` deletes existing `PlantPlacement` when bed changes; `MovePlantDialog` warns user when moving a placed plant; original bed's placements cache invalidated on move
- UI consistency pass — `GardenDialog` (merged create/edit); inline form removed from gardens page; Add buttons on all three "all" pages; `BedDialog`/`UserPlantDialog` accept optional `gardenId`/`bedId` with inline selectors; `AllGardens.tsx` rename; "Your X" headings everywhere; `PlantItem` component; `MovePlantDialog` refactored into `PickBedStep`/`CreateBedStep`; `BedItem` reused on `AllBeds` page; `posInt`/`optPosInt` extracted to `src/lib/zod.ts`
- `PlacementGrid` generic UI component in `components/ui/` — shared by `BedGrid` and `GardenGrid`; owns CSS grid rendering, cell iteration, multi-cell span (`gridTemplateRows` + explicit `gridColumnStart`/`gridRowStart`), empty cell button, hover-to-remove overlay; `renderCell` render prop for domain-specific cell content
- `BedPlacement` model, serializer, viewset, URLs — `GET/POST /api/gardens/:id/bed-placements/`, `DELETE /api/gardens/:id/bed-placements/:id/`; bounds validation in serializer; `GardenScopedMixin` extracted and shared by `GardenBedViewSet` and `BedPlacementViewSet`
- `GardenGrid` component — wraps `PlacementGrid`; computes bed footprint from dimensions at create time; shows bed name, dimensions, and plant count per cell; rendered on garden detail page when garden has dimensions set
- `PlaceBedDialog` — two-section layout ("Select a bed" / "Won't fit here"); pre-filters by bounds + overlap at the clicked cell; shows dimensions inline; disabled beds shown with section label explaining why

## 📋 Planned

### Authentication & Accounts
- User profile (timezone, locale settings, first/last name)
- Social login (Google, Facebook, etc.) via `django-allauth` + `dj-rest-auth` — add alongside existing username/password auth, not as a replacement

### Garden Organization (core)
- Edit and delete garden from the garden detail page — currently only possible from the garden list; the detail page has no actions menu
- Visual garden layout management
- Customizable garden dimensions and grids
- Drag-and-drop garden design interface
- Garden templates and presets
- Export/import garden plans

### Plants
- Add plants to garden layouts
- Plant spacing guidance
- Plant growth and lifecycle tracking
- Seed starting and transplant planning
- Seasonal planting schedules

### Testing
- **Backend unit tests** — serializer validation logic, model methods, helper functions (e.g. `bed_grid_dimensions`); use DRF's `APITestCase` against a real test DB; no mocking
- **Backend integration tests** — full API endpoint coverage (auth, gardens, beds, plants, placements, observations); assert status codes, response shapes, and ownership enforcement
- **Frontend unit/component tests** — Vitest + React Testing Library; test user-facing behaviour (form validation, conditional rendering, interactions); not implementation details
- **Frontend e2e tests** — Playwright against the full local stack (Docker); cover critical paths: register, create garden/bed/plant, place plant on grid, add observation
- **CI pipeline** — GitHub Actions: lint (`ruff`, `eslint`), type check (`tsc --noEmit`), unit tests on every PR; e2e on merge to `main`; Vercel/Railway auto-deploy runs after CI passes

### Deployment & Infrastructure
- CI/CD pipeline (GitHub Actions) — lint, type check, and unit tests gate every PR; Vercel/Railway auto-deploy already handles the deploy step
- Playwright e2e tests running in CI against the full stack
- Serve static/media files via S3
- Advanced AWS: RDS (managed PostgreSQL), ElastiCache (Redis), ECS/Fargate (containerized backend)
- **Semantic versioning** — separate FE and BE version numbers (e.g. `1.2.3`) displayed in the app footer; auto-incremented on every merge to `main` via GitHub Actions using `semantic-release` and conventional commits (`feat:`, `fix:`, `chore:`); FE version read from `package.json` at build time via Vite env var, BE version from a `VERSION` file or `pyproject.toml` exposed at `/api/version/`; frontend fetches BE version on load and renders both in a footer chip so it's easy to confirm a deploy went live without comparing SHAs
- **Preview environments per PR** — Vercel already creates a frontend preview URL per PR, but it points at prod backend so it only works for pure UI changes; full preview requires Railway PR Environments (ephemeral backend + DB per PR) wired together via a GitHub Action that sets `VITE_API_URL` on the Vercel preview to point at the Railway PR environment URL; needed for any PR that crosses the stack (new model, migration, endpoint, or serializer field)

### Tracking & Journaling
- Garden notes and journaling
- Harvest tracking
- Yield estimation and tracking
- Image uploads for plant/garden tracking
- Progress photo timelines

### Garden Health
- Companion planting recommendations
- Crop rotation tracking and recommendations
- Pest and disease tracking
- Soil and nutrient tracking
- Fertilizing schedules and reminders
- Watering and irrigation planning
- Sunlight and shade mapping

### Planning & Reminders
- Task management and reminders
- Notification system for gardening tasks
- Frost date awareness and seasonal guidance
- Weather-aware gardening insights
- Integration with external plant/weather data sources

### Discovery & Sharing
- Smart search and filtering
- Sharing gardens with other users
- Data visualization dashboards
- Garden analytics and historical trends

### Mobile App
- Port to iOS and Android using React Native (shared ecosystem with existing React codebase)
- Shared API layer and TypeScript types between web and mobile
- Native-feeling navigation and gestures
- Push notifications for gardening reminders and tasks
- Camera integration for plant/garden photo capture
- Offline-first support with sync when reconnected

### AI Integration
- OpenAI API integration (backend-controlled, not exposed directly to frontend)
- AI chat endpoint with conversation history (AIConversation model)
- Prompt builder and dynamic context assembly system
- AI-powered garden recommendations
- AI-powered plant compatibility analysis
- AI-powered troubleshooting and diagnostics
- AI-powered layout optimization
- Vector search / RAG for plant knowledge retrieval

### Admin & Infrastructure
- Admin dashboard and moderation tools
- Role-based permissions
- Offline-friendly support
