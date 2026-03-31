db\:up:
	docker compose up -d postgres
	@$(MAKE) db:wait

db\:wait:
	@echo Waiting for Postgres...
	@i=0; while [ $$i -lt 90 ]; do \
		if docker compose exec -T postgres pg_isready -U hackadevs -d hackadevs -q 2>/dev/null; then \
			echo Ready.; \
			exit 0; \
		fi; \
		i=$$((i+1)); \
		sleep 1; \
	done; \
	echo "Postgres not ready after 90s (Docker running? port 5432 free?)."; \
	exit 1

db\:down:
	docker compose down

db\:nuke:
	docker compose down -v

db\:generate:
	pnpm --filter @hackadevs/server run db:generate

db\:push:
	pnpm --filter @hackadevs/server run db:push

db\:migrate:
	docker compose up -d postgres
	@$(MAKE) db:wait
	pnpm --filter @hackadevs/server run db:migrate

db\:migrate\:deploy:
	docker compose up -d postgres
	@$(MAKE) db:wait
	pnpm --filter @hackadevs/server run db:migrate:deploy

dev:
	pnpm dev

dev\:web:
	pnpm exec turbo run dev --filter=@hackadevs/web

dev\:server:
	pnpm exec turbo run dev --filter=@hackadevs/server

test:
	pnpm --filter @hackadevs/server test

test\:coverage:
	pnpm --filter @hackadevs/server test:coverage

test\:e2e:
	pnpm exec playwright test

test\:e2e-install:
	pnpm exec playwright install chromium

test\:all:
	make test && make test:e2e

clean:
	pnpm clean

clean\:all:
	pnpm clean:all
