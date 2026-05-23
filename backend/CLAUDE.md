# Backend — Agent Context

---

# 🏗️ Tech Stack

**Current:**
- Python 3.x
- Django
- Django REST Framework (DRF)
- djangorestframework-camel-case — converts all API responses to camelCase and parses camelCase request bodies back to snake_case automatically; no changes needed in serializers or views
- SQLite (dev)

**Planned:**
- PostgreSQL (production database)
- Celery (background jobs — scheduled tasks, reminders, weather checks)
- Redis (Celery broker + cache)

---

# 🧰 Tooling

- Ruff — linting + autofix; config in `ruff.toml`; rules: `E`, `F`, `W`, `I`, `B`, `UP`, `RUF`, `T20`; line length 120; migrations excluded
- Black — formatting

---

# 🐳 Docker Workflow

The dev database runs inside Docker. Always apply migrations to it after generating them:

```
python manage.py makemigrations <app>
docker compose exec backend python manage.py migrate
```

**Never skip the second step.** Running `makemigrations` locally creates the migration file but does not touch the Docker PostgreSQL database. The dev server will error with `relation "..." does not exist` until `migrate` is run inside the container.

---

# 📁 App Structure

Django monolith with modular apps:

- `auth` — user registration, login, JWT token management
- `gardens` — Garden and GardenBed models and API
- `plants` — Plant catalog and UserPlant placement
- `ai` — OpenAI integration, prompt building, conversation history

---

# 🧪 Conventions

- Follow the ruff rules configured in `ruff.toml` — new code should introduce zero errors and zero warnings; if a rule fires on intentional code, suppress it with `# noqa: <code>` and a comment explaining why
- Use Django REST Framework ViewSets where possible
- Serializers define all API output — no raw JSON construction in views
- Keep business logic out of views when possible
- Avoid fat models early — keep domain simple until complexity demands it
- All queryset filtering should scope to `request.user` to enforce ownership
- Nested resources (e.g. beds under a garden) use manual URL patterns with `ViewSet.as_view({...})` rather than `drf-nested-routers` — keeps the dependency list lean; see `gardens/urls.py` for the pattern
- Nested ViewSets enforce ownership by looking up the parent via `request.user` in a `_get_parent()` helper and raising `NotFound` if it doesn't belong to the user
- Shared lookup logic across multiple ViewSets lives in a mixin (e.g. `BedScopedMixin` in `plants/views.py` provides `_get_bed()` to both `UserPlantViewSet` and `PlantPlacementViewSet`)
- URL kwargs use descriptive `_id` suffix names for all manual URL patterns (`garden_id`, `bed_id`, `plant_id`, `observation_id`, `placement_id`); set `lookup_url_kwarg` on the ViewSet to match. The router-generated garden URLs use the DRF default `pk`.
- Model choice fields use `models.TextChoices` inner classes (e.g. `UserPlant.Status`, `Observation.Type`, `Plant.Category`) — reference constants as `Model.ChoiceClass.VALUE` rather than raw strings
- All entity list endpoints order by `name, -created_at`; event/history endpoints (observations) order chronologically
- All models inherit `BaseModel` from `core/models.py` — provides UUID primary key, `created_at`, `updated_at`
- Timestamps returned in ISO 8601 format
- All JSON field names are returned as camelCase (handled by `djangorestframework-camel-case`) — serializer fields stay snake_case as normal; the renderer/parser handles conversion at the HTTP boundary
- Eliminate N+1 queries by using `select_related` for FK traversals in serializer `source` fields, and `annotate(Count(...))` for computed counts — never use `source="related_manager.count"` on a serializer field

---

# 🧫 Testing

Testing is a learning goal for this project. As features mature, add:
- Unit tests for serializers and model logic
- Integration tests for API endpoints (use DRF's `APITestCase`)
- Avoid mocking the database — tests should hit a real test DB
