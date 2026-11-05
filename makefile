docker-build:
	docker build -f apps/web/Dockerfile -t waxblock-frontend .
	docker build -f apps/api/Dockerfile -t waxblock-api .

docker-up:
	docker compose up -d --force-recreate

docker-build-up:
	docker compose up -d --force-recreate --build

docker-run:
	docker compose up --force-recreate

docker-stop:
	docker compose down

docker-remove:
	docker compose down -v

docker-logs:
	docker compose logs -f

docker-bash:
	docker compose exec waxblock-frontend bash
