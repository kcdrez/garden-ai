# Garden AI - Backend

This is the Django backend for the Garden AI project.

It provides:

- REST API for garden management
- User authentication (future)
- AI integration endpoints (future)
- Data storage for gardens, plants, and user configurations

---

# Tech Stack

- Python 3.x
- Django
- Django REST Framework
- SQLite (local dev default)
- PostgreSQL (future)
- Redis (future)
- Celery (future)

---

# Setup Instructions

## 1. Create virtual environment

From /backend:

python3 -m venv venv

---

## 2. Activate virtual environment

macOS / Linux:
source venv/bin/activate

Windows:
venv\Scripts\activate

---

## 3. Install dependencies

pip install django djangorestframework django-cors-headers

Optional:
pip freeze > requirements.txt

---

## 4. Run migrations

python manage.py migrate

---

## 5. Create admin user

python manage.py createsuperuser

---

## 6. Run development server

python manage.py runserver

Backend:
http://127.0.0.1:8000/

Admin:
http://127.0.0.1:8000/admin

---

# Project Structure

backend/
config/ Django project settings
gardens/ Core app (garden domain)
manage.py
venv/

---

# Useful Commands

Create app:
python manage.py startapp <app_name>

Create migrations:
python manage.py makemigrations

Apply migrations:
python manage.py migrate

Run server:
python manage.py runserver

---

# Environment Notes

- Default DB: SQLite
- CORS enabled for http://localhost:5173
- Debug mode ON for local dev

---

# Next Steps

- Build REST API with DRF
- Add JWT authentication
- Connect React frontend
- Add AI service layer
- Add Celery + Redis (background tasks)

---

# Notes

This backend is designed for learning full-stack architecture:

- API design
- database modeling
- authentication systems
- AI integration
- cloud deployment (AWS)
