dev:
	venv/bin/python manage.py runserver

migrate:
	venv/bin/python manage.py migrate

migrations:
	venv/bin/python manage.py makemigrations

shell:
	venv/bin/python manage.py shell

test:
	cd .. && docker compose exec backend python manage.py test gardens.tests plants.tests users.tests

test-app:
	cd .. && docker compose exec backend python manage.py test $(app).tests

coverage:
	cd .. && docker compose exec backend coverage run manage.py test gardens.tests plants.tests users.tests
	cd .. && docker compose exec backend coverage report
