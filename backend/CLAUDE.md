# Backend — Agent Context

---

# 🏗️ Tech Stack

**Current:**
- Python 3.x
- Django
- Django REST Framework (DRF)
- SQLite (dev)

**Planned:**
- PostgreSQL (production database)
- Celery (background jobs — scheduled tasks, reminders, weather checks)
- Redis (Celery broker + cache)

---

# 🧰 Tooling

- Ruff — linting + autofix
- Black — formatting

---

# 📁 App Structure

Django monolith with modular apps:

- `auth` — user registration, login, JWT token management
- `gardens` — Garden and GardenBed models and API
- `plants` — Plant catalog and UserPlant placement
- `ai` — OpenAI integration, prompt building, conversation history

---

# 🧪 Conventions

- Use Django REST Framework ViewSets where possible
- Serializers define all API output — no raw JSON construction in views
- Keep business logic out of views when possible
- Avoid fat models early — keep domain simple until complexity demands it
- All queryset filtering should scope to `request.user` to enforce ownership
- Timestamps returned in ISO 8601 format

---

# 🧫 Testing

Testing is a learning goal for this project. As features mature, add:
- Unit tests for serializers and model logic
- Integration tests for API endpoints (use DRF's `APITestCase`)
- Avoid mocking the database — tests should hit a real test DB
