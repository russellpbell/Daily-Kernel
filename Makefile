.PHONY: dev-backend dev-frontend dev build deploy

dev-backend:
	cd backend && uvicorn app.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

dev:
	@echo "Run 'make dev-backend' and 'make dev-frontend' in separate terminals"

install:
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

build:
	cd frontend && npm run build

clean:
	rm -rf frontend/dist frontend/node_modules backend/__pycache__
