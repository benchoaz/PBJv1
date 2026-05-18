# Testing & Deployment Guide - Sistem Monitoring Pengadaan B/J

## Arsitektur Deployment

```
┌────────────────────────────────────────────────────────────┐
│                    Docker Compose Stack                     │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │ Frontend │  │ Backend  │  │  n8n     │  │ Puppeteer │  │
│  │ (Next.js)│  │ (Go API) │  │          │  │ Service   │  │
│  │ :3000    │  │ :8080    │  │ :5678    │  │ :3000     │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬─────┘  │
│       │              │              │               │        │
│       ▼              ▼              ▼               ▼        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              PostgreSQL (:5432)                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Redis (:6379) - Queue & Cache            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Prometheus (:9090) + Grafana (:3001)     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

---

## Docker Compose Configuration

### `docker-compose.yml`

```yaml
version: '3.8'

services:
  # ============================================
  # DATABASE
  # ============================================
  postgres:
    image: postgres:16-alpine
    container_name: pbj_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: pbj_monitoring
      POSTGRES_USER: pbj_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docs/database-schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U pbj_user -d pbj_monitoring"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - pbj_network

  # ============================================
  # REDIS (Queue & Cache)
  # ============================================
  redis:
    image: redis:7-alpine
    container_name: pbj_redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD} --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - pbj_network

  # ============================================
  # BACKEND (Go API)
  # ============================================
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: pbj_backend
    restart: unless-stopped
    environment:
      - DATABASE_URL=postgres://pbj_user:${DB_PASSWORD}@postgres:5432/pbj_monitoring?sslmode=disable
      - REDIS_URL=redis://redis:6379/0
      - JWT_SECRET=${JWT_SECRET}
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
      - N8N_WEBHOOK_URL=http://n8n:5678/webhook
      - PUPPETEER_SERVICE_URL=http://puppeteer-service:3000
      - GIN_MODE=release
    ports:
      - "8080:8080"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - pbj_network

  # ============================================
  # FRONTEND (Next.js)
  # ============================================
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: pbj_frontend
    restart: unless-stopped
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
      - NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - pbj_network

  # ============================================
  # n8n WORKFLOW ENGINE
  # ============================================
  n8n:
    image: n8nio/n8n:latest
    container_name: pbj_n8n
    restart: unless-stopped
    environment:
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=pbj_monitoring
      - DB_POSTGRESDB_USER=pbj_user
      - DB_POSTGRESDB_PASSWORD=${DB_PASSWORD}
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=${N8N_USER}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
      - N8N_HOST=n8n
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - WEBHOOK_URL=http://n8n:5678/
      - N8N_METRICS=true
      - EXECUTIONS_DATA_PRUNE=true
      - EXECUTIONS_DATA_MAX_AGE=168
    volumes:
      - n8n_data:/home/node/.n8n
      - ./workflows:/home/node/.n8n/workflows
    ports:
      - "5678:5678"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - pbj_network

  # ============================================
  # PUPPETEER SERVICE
  # ============================================
  puppeteer-service:
    build:
      context: ./puppeteer-service
      dockerfile: Dockerfile
    container_name: pbj_puppeteer
    restart: unless-stopped
    environment:
      - PORT=3000
      - SCREENSHOT_DIR=/app/screenshots
      - MAX_CONCURRENT_BROWSERS=3
      - BROWSER_TIMEOUT=60000
    volumes:
      - screenshots_data:/app/screenshots
    ports:
      - "3001:3000"
    shm_size: '2gb'
    networks:
      - pbj_network

  # ============================================
  # PROMETHEUS
  # ============================================
  prometheus:
    image: prom/prometheus:latest
    container_name: pbj_prometheus
    restart: unless-stopped
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    networks:
      - pbj_network

  # ============================================
  # GRAFANA
  # ============================================
  grafana:
    image: grafana/grafana:latest
    container_name: pbj_grafana
    restart: unless-stopped
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana-dashboards:/etc/grafana/provisioning/dashboards
    ports:
      - "3002:3000"
    depends_on:
      - prometheus
    networks:
      - pbj_network

volumes:
  postgres_data:
  redis_data:
  n8n_data:
  screenshots_data:
  prometheus_data:
  grafana_data:

networks:
  pbj_network:
    driver: bridge
```

---

## Environment Variables

### `.env` (Template)

```env
# ============================================
# DATABASE
# ============================================
DB_PASSWORD=change_me_strong_password_123

# ============================================
# REDIS
# ============================================
REDIS_PASSWORD=change_me_redis_password_456

# ============================================
# JWT
# ============================================
JWT_SECRET=change_me_jwt_secret_key_789

# ============================================
# n8n
# ============================================
N8N_USER=admin
N8N_PASSWORD=change_me_n8n_password_abc

# ============================================
# TELEGRAM
# ============================================
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxYZ

# ============================================
# GRAFANA
# ============================================
GRAFANA_PASSWORD=change_me_grafana_password_def

# ============================================
# NODE ENV
# ============================================
NODE_ENV=production
```

---

## Testing Strategy

### 1. Unit Tests (Backend - Go)

```go
// backend/internal/repository/paket_test.go
package repository_test

import (
    "context"
    "testing"
    "time"

    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/suite"
    "github.com/testcontainers/testcontainers-go"
    "github.com/testcontainers/testcontainers-go/modules/postgres"
)

type PaketRepositoryTestSuite struct {
    suite.Suite
    container *postgres.PostgresContainer
    repo      *repository.PaketRepository
}

func (s *PaketRepositoryTestSuite) SetupSuite() {
    ctx := context.Background()
    
    container, err := postgres.Run(ctx,
        "postgres:16-alpine",
        postgres.WithDatabase("pbj_test"),
        postgres.WithUsername("test"),
        postgres.WithPassword("test"),
        postgres.WithInitScripts("../../docs/database-schema.sql"),
    )
    s.NoError(err)
    s.container = container
    
    connStr, _ := container.ConnectionString(ctx, "sslmode=disable")
    // Initialize repo with test connection
    s.repo = repository.NewPaketRepository(connStr)
}

func (s *PaketRepositoryTestSuite) TearDownSuite() {
    s.container.Terminate(context.Background())
}

func (s *PaketRepositoryTestSuite) TestCreatePaket() {
    ctx := context.Background()
    
    paket := &models.PaketPengadaan{
        NamaPaket:    "Paket Test Pengadaan Laptop",
        KodePaket:    "LPSE-2024-001",
        URLLPSE:      "https://lpse.example.com/tender/123",
        KLPD:         "Dinas Pendidikan Kota Bandung",
        JenisPengadaan: "BARANG",
        TahunAnggaran: 2024,
        Pagu:         500000000,
        HPS:          450000000,
        CurrentTahapan: 0,
        Status:       "DRAFT",
    }
    
    created, err := s.repo.Create(ctx, paket)
    
    s.NoError(err)
    s.NotEmpty(created.ID)
    s.Equal("Paket Test Pengadaan Laptop", created.NamaPaket)
    s.Equal("DRAFT", created.Status)
}

func (s *PaketRepositoryTestSuite) TestGetPaketByID() {
    ctx := context.Background()
    
    // Create first
    paket := &models.PaketPengadaan{
        NamaPaket: "Test Get By ID",
        Status:    "DRAFT",
    }
    created, _ := s.repo.Create(ctx, paket)
    
    // Retrieve
    found, err := s.repo.GetByID(ctx, created.ID)
    
    s.NoError(err)
    s.Equal(created.ID, found.ID)
    s.Equal("Test Get By ID", found.NamaPaket)
}

func (s *PaketRepositoryTestSuite) TestListPaketWithPagination() {
    ctx := context.Background()
    
    // Create multiple
    for i := 0; i < 15; i++ {
        s.repo.Create(ctx, &models.PaketPengadaan{
            NamaPaket: "Paket " + string(rune(i)),
            Status:    "AKTIF",
        })
    }
    
    // Page 1
    results, count, err := s.repo.List(ctx, repository.ListParams{
        Page:     1,
        PageSize: 10,
        Status:   "AKTIF",
    })
    
    s.NoError(err)
    s.Len(results, 10)
    s.GreaterOrEqual(count, int64(15))
}

func TestPaketRepository(t *testing.T) {
    suite.Run(t, new(PaketRepositoryTestSuite))
}
```

### 2. Integration Tests (API - Go)

```go
// backend/internal/handler/paket_handler_test.go
package handler_test

import (
    "bytes"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "testing"

    "github.com/gin-gonic/gin"
    "github.com/stretchr/testify/assert"
)

func TestCreatePaketAPI(t *testing.T) {
    router := setupTestRouter()
    
    payload := map[string]interface{}{
        "nama_paket":      "Paket Integration Test",
        "kode_paket":      "TEST-001",
        "url_lpse":        "https://lpse.example.com/tender/999",
        "klpd":            "Dinas Test",
        "jenis_pengadaan": "BARANG",
        "tahun_anggaran":  2024,
        "pagu":            100000000,
    }
    body, _ := json.Marshal(payload)
    
    req := httptest.NewRequest(http.MethodPost, "/api/v1/paket", bytes.NewReader(body))
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Authorization", "Bearer "+testToken)
    
    w := httptest.NewRecorder()
    router.ServeHTTP(w, req)
    
    assert.Equal(t, http.StatusCreated, w.Code)
    
    var response map[string]interface{}
    json.Unmarshal(w.Body.Bytes(), &response)
    assert.Equal(t, "success", response["status"])
}

func TestGetPaketListAPI(t *testing.T) {
    router := setupTestRouter()
    
    req := httptest.NewRequest(http.MethodGet, "/api/v1/paket?page=1&per_page=10", nil)
    req.Header.Set("Authorization", "Bearer "+testToken)
    
    w := httptest.NewRecorder()
    router.ServeHTTP(w, req)
    
    assert.Equal(t, http.StatusOK, w.Code)
}
```

### 3. Frontend Tests (Next.js)

```typescript
// frontend/__tests__/paket-list.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import PaketListPage from '@/app/paket/page'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
)

// Mock API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      data: [
        {
          id: '1',
          nama_paket: 'Pengadaan Laptop',
          status: 'AKTIF',
          current_tahapan: 5,
          total_tahapan: 16,
        }
      ],
      total: 1,
      page: 1,
    }),
  })
) as jest.Mock

describe('PaketListPage', () => {
  it('renders paket list', async () => {
    render(<PaketListPage />, { wrapper })
    
    await waitFor(() => {
      expect(screen.getByText('Pengadaan Laptop')).toBeInTheDocument()
    })
  })
  
  it('shows progress bar correctly', async () => {
    render(<PaketListPage />, { wrapper })
    
    await waitFor(() => {
      const progress = screen.getByText('5/16')
      expect(progress).toBeInTheDocument()
    })
  })
})
```

### 4. E2E Tests (Playwright)

```typescript
// e2e/paket-workflow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Paket Pengadaan Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('[name="username"]', 'admin')
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('create new paket and verify in list', async ({ page }) => {
    // Navigate to create form
    await page.click('text=Tambah Paket')
    await expect(page).toHaveURL(/\/paket\/baru/)

    // Fill form
    await page.fill('[name="nama_paket"]', 'E2E Test Paket')
    await page.fill('[name="kode_paket"]', 'E2E-001')
    await page.fill('[name="url_lpse"]', 'https://lpse.example.com/tender/e2e')
    await page.fill('[name="klpd"]', 'Dinas E2E Test')
    await page.selectOption('[name="jenis_pengadaan"]', 'BARANG')
    await page.fill('[name="tahun_anggaran"]', '2024')
    await page.fill('[name="pagu"]', '100000000')

    // Submit
    await page.click('button[type="submit"]')
    
    // Verify redirect to detail
    await page.waitForURL(/\/paket\/[a-f0-9-]+/)
    
    // Verify data
    await expect(page.locator('text=E2E Test Paket')).toBeVisible()
    await expect(page.locator('text=E2E-001')).toBeVisible()
  })

  test('view tahapan progress', async ({ page }) => {
    await page.goto('/paket')
    await page.click('text=Pengadaan Laptop')
    
    // Verify SOP timeline
    const timeline = page.locator('[data-testid="sop-timeline"]')
    await expect(timeline).toBeVisible()
    
    // Verify 16 steps
    const steps = page.locator('[data-testid="tahapan-item"]')
    await expect(steps).toHaveCount(16)
  })

  test('view screenshot modal', async ({ page }) => {
    await page.goto('/paket')
    await page.click('text=Pengadaan Laptop')
    
    // Click screenshot thumbnail
    await page.click('[data-testid="screenshot-thumbnail"]')
    
    // Verify modal
    const modal = page.locator('[data-testid="screenshot-modal"]')
    await expect(modal).toBeVisible()
    
    // Close
    await page.click('[data-testid="close-modal"]')
    await expect(modal).not.toBeVisible()
  })
})
```

### 5. Scraping Service Tests

```typescript
// puppeteer-service/__tests__/scraper.test.ts
import { ScraperService } from '../src/services/scraper'
import { mockPage, mockBrowser } from './mocks/puppeteer'

describe('ScraperService', () => {
  let scraper: ScraperService

  beforeEach(() => {
    scraper = new ScraperService()
  })

  describe('scrapeTahapan', () => {
    it('extracts tahapan data from LPSE page', async () => {
      const result = await scraper.scrapeTahapan({
        url: 'https://lpse.example.com/tender/123',
        tahapanNomor: 1,
      })

      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('screenshot')
      expect(result.data).toHaveProperty('status')
    })

    it('handles timeout gracefully', async () => {
      await expect(
        scraper.scrapeTahapan({
          url: 'https://lpse.example.com/slow-page',
          timeout: 1000,
        })
      ).rejects.toThrow('timeout')
    })

    it('extracts links from page', async () => {
      const result = await scraper.scrapeTahapan({
        url: 'https://lpse.example.com/tender/123',
        extractLinks: true,
      })

      expect(result.links).toBeInstanceOf(Array)
    })
  })

  describe('takeScreenshot', () => {
    it('captures full page screenshot', async () => {
      const result = await scraper.takeScreenshot({
        url: 'https://lpse.example.com/tender/123',
        fullPage: true,
      })

      expect(result).toHaveProperty('path')
      expect(result.path).toMatch(/\.png$/)
    })
  })
})
```

---

## Testing Commands

```bash
# Backend Tests
cd backend
go test ./... -v                          # All tests
go test ./internal/repository/... -v      # Repository only
go test ./internal/handler/... -v         # Handler only
go test -cover ./...                      # With coverage
go test -coverprofile=coverage.out ./...  # Generate coverage file

# Frontend Tests
cd frontend
npm test                                  # All tests
npm run test:watch                        # Watch mode
npm run test:coverage                     # Coverage report
npx playwright test                       # E2E tests
npx playwright test --ui                  # E2E with UI

# Puppeteer Service Tests
cd puppeteer-service
npm test                                  # Unit tests
npm run test:integration                  # Integration (needs running service)

# Docker-based Integration Tests
docker compose -f docker-compose.test.yml up --abort-on-container-exit
```

---

## Deployment Procedure

### Development Environment

```bash
# 1. Clone repository
git clone <repo-url>
cd PBJ

# 2. Copy env template
cp .env.example .env
# Edit .env with your values

# 3. Start all services
docker compose up -d

# 4. Check health
docker compose ps
curl http://localhost:8080/health
curl http://localhost:5678/healthz

# 5. Run migrations (if needed)
docker compose exec backend ./migrate up

# 6. Import n8n workflows
# Open http://localhost:5678 and import JSON files from /workflows
```

### Production Deployment

```bash
# 1. Build production images
docker compose build

# 2. Run database migrations
docker compose exec backend ./migrate up

# 3. Start services
docker compose up -d

# 4. Verify
docker compose ps
docker compose logs -f --tail=100
```

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # Backend Tests
  backend-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: pbj_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.22'
      - name: Run tests
        working-directory: backend
        env:
          DATABASE_URL: postgres://test:test@localhost:5432/pbj_test?sslmode=disable
        run: go test -cover ./...

  # Frontend Tests
  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      - name: Install & Test
        working-directory: frontend
        run: |
          npm ci
          npm run lint
          npm test -- --coverage

  # E2E Tests
  e2e-test:
    runs-on: ubuntu-latest
    needs: [backend-test, frontend-test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install Playwright
        working-directory: frontend
        run: |
          npm ci
          npx playwright install
      - name: Run E2E
        working-directory: frontend
        run: npx playwright test

  # Build & Push Docker Images
  build:
    runs-on: ubuntu-latest
    needs: [backend-test, frontend-test]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Build and Push
        run: |
          docker compose build
          docker compose push
```

---

## Backup & Recovery

### Database Backup
```bash
# Manual backup
docker compose exec postgres pg_dump -U pbj_user pbj_monitoring > backup_$(date +%Y%m%d).sql

# Automated daily backup (cron)
# 0 2 * * * docker compose -f /path/to/PBJ/docker-compose.yml exec -T postgres pg_dump -U pbj_user pbj_monitoring | gzip > /backups/pbj_$(date +\%Y\%m\%d).sql.gz
```

### Restore
```bash
gunzip -c backup_20240101.sql.gz | docker compose exec -T postgres psql -U pbj_user pbj_monitoring
```

### Volume Backup
```bash
docker compose run --rm -v pbj_postgres_data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/postgres_data_$(date +%Y%m%d).tar.gz /data
```

---

## Monitoring & Alerts

### Health Check Script
```bash
#!/bin/bash
# scripts/health-check.sh

services=("backend:8080/health" "n8n:5678/healthz" "postgres:5432")
all_healthy=true

for service in "${services[@]}"; do
    name=$(echo $service | cut -d: -f1)
    port=$(echo $service | cut -d: -f2)
    
    if curl -sf "http://localhost:$port" > /dev/null 2>&1; then
        echo "✅ $name is healthy"
    else
        echo "❌ $name is unhealthy"
        all_healthy=false
    fi
done

if [ "$all_healthy" = false ]; then
    echo "⚠️  Some services are unhealthy!"
    exit 1
fi
```

### Log Aggregation
```bash
# View logs per service
docker compose logs -f backend
docker compose logs -f n8n
docker compose logs -f puppeteer-service

# View last 100 lines
docker compose logs --tail=100
```
