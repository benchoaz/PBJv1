# n8n Workflow Design - Sistem Monitoring Pengadaan B/J

## Arsitektur Workflow n8n

### Overview

n8n digunakan sebagai orchestrator utama untuk:
1. Menjalankan scraping secara terjadwal
2. Mengelola state machine tahapan SOP (16 langkah)
3. Mengirim notifikasi ke Telegram
4. Menyimpan hasil ke database PostgreSQL
5. Menangani retry dan error recovery

### Diagram Alur Utama

```
┌─────────────────────────────────────────────────────────┐
│                    n8n Workflow Engine                    │
│                                                           │
│  ┌─────────┐    ┌──────────┐    ┌─────────────┐         │
│  │ Cron     │───▶│ Check    │───▶│ Scrape      │         │
│  │ Schedule │    │ Queue    │    │ LPSE Page   │         │
│  └─────────┘    └──────────┘    └──────┬──────┘         │
│                                         │                 │
│                                    ┌────▼────┐           │
│                                    │ Extract │           │
│                                    │ Data    │           │
│                                    └────┬────┘           │
│                                         │                 │
│                    ┌────────────────────┼────────────┐    │
│                    ▼                    ▼            ▼    │
│              ┌──────────┐    ┌───────────┐  ┌───────┐   │
│              │ Update   │    │ Take      │  │ Check │   │
│              │ Database │    │ Screenshot│  │ Links │   │
│              └────┬─────┘    └─────┬─────┘  └───┬───┘   │
│                   │                │             │        │
│                   ▼                ▼             ▼        │
│              ┌──────────────────────────────────────┐    │
│              │         Send Notification            │    │
│              │    (Telegram / Email / Dashboard)    │    │
│              └──────────────────────────────────────┘    │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## Workflow 1: Scrape Tahapan Paket (Utama)

### File: `workflows/scrape-tahapan.json`

**Trigger**: Cron Schedule (setiap 6 jam) + Manual Webhook

**Nodes**:

#### 1. Cron Trigger / Webhook
```json
{
  "type": "n8n-nodes-base.scheduleTrigger",
  "parameters": {
    "rule": {
      "interval": [
        { "field": "hours", "hoursInterval": 6 }
      ]
    }
  }
}
```

Alternative manual trigger via webhook:
```json
{
  "type": "n8n-nodes-base.webhook",
  "parameters": {
    "path": "scrape-trigger",
    "method": "POST",
    "responseMode": "lastNode"
  }
}
```

#### 2. Get Active Paket dari Database
```sql
-- PostgreSQL Node
SELECT
    p.id,
    p.nama_paket,
    p.kode_paket,
    p.url_lpse,
    p.current_tahapan,
    p.status
FROM paket_pengadaan p
WHERE p.status = 'AKTIF'
  AND p.current_tahapan < 16
ORDER BY p.updated_at ASC
LIMIT 10;
```

#### 3. Loop Per Paket (SplitInBatches)
Proses setiap paket secara sequential untuk menghindari rate limiting.

#### 4. Get Detail Tahapan Saat Ini
```sql
-- PostgreSQL Node
SELECT
    t.id,
    t.nomor_tahapan,
    t.nama_tahapan,
    t.status,
    t.screenshot_path,
    t.extracted_links
FROM tahapan_sop t
WHERE t.paket_id = '{{ $json.id }}'
  AND t.nomor_tahapan = '{{ $json.current_tahapan + 1 }}'
ORDER BY t.nomor_tahapan
LIMIT 1;
```

#### 5. Create Scraping Job
```sql
INSERT INTO scraping_jobs (
    paket_id,
    tahapan_nomor,
    url_target,
    status,
    started_at,
    triggered_by
) VALUES (
    '{{ $json.paket_id }}',
    '{{ $json.nomor_tahapan }}',
    '{{ $json.url_lpse }}',
    'RUNNING',
    now(),
    NULL
) RETURNING id;
```

#### 6. HTTP Request ke Puppeteer Service
```json
{
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "url": "http://puppeteer-service:3000/scrape",
    "method": "POST",
    "contentType": "json",
    "body": {
      "jobId": "={{ $json.id }}",
      "url": "={{ $('Get Tahapan').item.json.url_lpse }}",
      "action": "scrape_tahapan",
      "tahapan_nomor": "={{ $('Get Tahapan').item.json.nomor_tahapan }}",
      "options": {
        "takeScreenshot": true,
        "extractLinks": true,
        "timeout": 60000
      }
    }
  }
}
```

#### 7. Update Scraping Job (Success)
```sql
UPDATE scraping_jobs
SET
    status = 'SUCCESS',
    screenshot_path = '{{ $json.screenshot_path }}',
    extracted_data = '{{ $json.extracted_data }}'::jsonb,
    extracted_links = '{{ $json.extracted_links }}'::jsonb,
    completed_at = now(),
    duration_ms = EXTRACT(EPOCH FROM (now() - started_at)) * 1000
WHERE id = '{{ $json.job_id }}';
```

#### 8. Update Tahapan Status
```sql
UPDATE tahapan_sop
SET
    status = 'COMPLETED',
    screenshot_path = '{{ $json.screenshot_path }}',
    screenshot_url = '{{ $json.screenshot_url }}',
    extracted_links = '{{ $json.extracted_links }}'::jsonb,
    completed_at = now()
WHERE paket_id = '{{ $paket_id }}'
  AND nomor_tahapan = '{{ $nomor_tahapan }}';
```

#### 9. Advance Current Tahapan
```sql
UPDATE paket_pengadaan
SET
    current_tahapan = current_tahapan + 1,
    status = CASE
        WHEN current_tahapan + 1 >= 16 THEN 'SELESAI'
        ELSE status
    END,
    updated_at = now()
WHERE id = '{{ $paket_id }}';
```

#### 10. Send Telegram Notification
```json
{
  "type": "n8n-nodes-base.telegram",
  "parameters": {
    "chatId": "={{ $json.telegram_chat_id }}",
    "text": "=✅ *Tahapan Selesai*\n\n📦 Paket: {{ $nama_paket }}\n📋 Tahapan {{ $nomor_tahapan }}/{{ $total_tahapan }}: {{ $nama_tahapan }}\n📊 Status: {{ $status }}\n\n{{ $extracted_links }}",
    "parseMode": "Markdown"
  }
}
```

### Error Handling Branch

#### 11. Error Handler (on fail)
```sql
-- Update scraping job as failed
UPDATE scraping_jobs
SET
    status = 'FAILED',
    error_message = '{{ $json.error.message }}',
    retry_count = retry_count + 1,
    completed_at = now()
WHERE id = '{{ $job_id }}';
```

#### 12. Check Retry
```json
{
  "type": "n8n-nodes-base.if",
  "parameters": {
    "conditions": {
      "number": [{
        "value1": "={{ $json.retry_count }}",
        "operation": "smallerEqual",
        "value2": 3
      }]
    }
  }
}
```

Jika retry_count <= max_retries → kembali ke step 6 (retry)
Jika melebihi → kirim error notification

#### 13. Send Error Notification
```json
{
  "type": "n8n-nodes-base.telegram",
  "parameters": {
    "text": "=❌ *Scraping Gagal*\n\n📦 Paket: {{ $nama_paket }}\n📋 Tahapan: {{ $nomor_tahapan }}\n⚠️ Error: {{ $error_message }}\n🔄 Retry: {{ $retry_count }}/3"
  }
}
```

---

## Workflow 2: Scrape e-Katalog (LPSE Product)

### Trigger: Webhook dari UI

**Tujuan**: Scrape halaman detail produk e-Katalog untuk mendapatkan informasi harga dan spesifikasi.

### Nodes:

1. **Webhook Trigger**: Menerima URL e-Katalog dari frontend
2. **Validate URL**: Pastikan URL valid dan domain benar
3. **HTTP Request ke Puppeteer**: Scrape halaman produk
4. **Parse Product Data**: Extract harga, spesifikasi, vendor
5. **Update Database**: Simpan data ke paket_pengadaan
6. **Return Result**: Kirim hasil ke frontend via webhook response

### Detail Scrape e-Katalog:

```json
{
  "url": "http://puppeteer-service:3000/scrape-ekatalog",
  "method": "POST",
  "body": {
    "url": "https://e-katalog.lkpp.go.id/id/produk/detail/XXXXX",
    "options": {
      "extractProduct": true,
      "extractPrice": true,
      "extractVendor": true,
      "takeScreenshot": true
    }
  }
}
```

---

## Workflow 3: Daily Summary Report

### Trigger: Cron (setiap hari jam 08:00 WIB)

**Tujuan**: Kirim ringkasan harian ke semua admin/supervisor via Telegram.

### Nodes:

1. **Cron Trigger**: `0 1 * * *` (UTC 01:00 = WIB 08:00)
2. **Get Dashboard Stats**:
```sql
SELECT * FROM vw_dashboard_stats;
```

3. **Get Recent Changes**:
```sql
SELECT
    p.nama_paket,
    t.nomor_tahapan,
    t.nama_tahapan,
    t.status,
    t.updated_at,
    u.full_name AS updated_by
FROM tahapan_sop t
JOIN paket_pengadaan p ON p.id = t.paket_id
LEFT JOIN users u ON u.id = p.created_by
WHERE t.updated_at > now() - interval '24 hours'
  AND t.status IN ('COMPLETED', 'IN_PROGRESS')
ORDER BY t.updated_at DESC;
```

4. **Format Report**:
```
📊 Laporan Harian Monitoring PBJ
Tanggal: {{ $date }}

📈 Ringkasan:
• Total Paket: {{ $total_paket }}
• Aktif: {{ $paket_aktif }}
• Selesai: {{ $paket_selesai }}
• Draft: {{ $paket_draft }}

🔄 Perubahan 24 Jam Terakhir:
{{ #each changes }}
• {{ nama_paket }} - Tahapan {{ nomor_tahapan }}: {{ status }}
{{ /each }}

⚠️ Scraping Gagal (24h): {{ $scraping_failed_24h }}
```

5. **Send to All Active Users**:
```sql
SELECT telegram_chat_id FROM users
WHERE is_active = true
  AND role IN ('admin', 'supervisor')
  AND telegram_chat_id IS NOT NULL;
```

6. **Send Telegram** (loop per user)

---

## Workflow 4: Error Alert

### Trigger: Webhook dari Puppeteer Service

**Tujuan**: Real-time alert saat scraping error kritis.

### Nodes:

1. **Webhook Trigger**: Menerima error report dari Puppeteer
2. **Log to Database**:
```sql
INSERT INTO activity_logs (action, entity_type, entity_id, description, metadata)
VALUES ('SCRAPE_ERROR', 'scraping_job', '{{ $json.job_id }}'::uuid,
        '{{ $json.error_message }}',
        '{{ $json }}'::jsonb);
```

3. **Create Notification**:
```sql
INSERT INTO notifications (user_id, type, title, message, data)
SELECT
    id,
    'ERROR_ALERT',
    'Scraping Error',
    '{{ $json.error_message }}',
    '{{ $json }}'::jsonb
FROM users
WHERE is_active = true AND role = 'admin';
```

4. **Send Telegram Alert**:
```json
{
  "text": "=🚨 *ALERT: Scraping Error*\n\nJob ID: {{ $json.job_id }}\nURL: {{ $json.url }}\nError: {{ $json.error_message }}\nTime: {{ $now }}"
}
```

---

## Environment Variables (n8n)

```env
# Database
N8N_POSTGRES_HOST=postgres
N8N_POSTGRES_PORT=5432
N8N_POSTGRES_DATABASE=pbj_monitoring
N8N_POSTGRES_USER=pbj_user
N8N_POSTGRES_PASSWORD=${DB_PASSWORD}

# n8n
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
N8N_HOST=n8n
N8N_PORT=5678
N8N_PROTOCOL=http
WEBHOOK_URL=http://n8n:5678/

# Telegram
TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}

# Puppeteer Service
PUPPETEER_SERVICE_URL=http://puppeteer-service:3000

# Features
N8N_METRICS=true
N8N_METRICS_PORT=9119
EXECUTIONS_DATA_PRUNE=true
EXECUTIONS_DATA_MAX_AGE=168
```

---

## Konfigurasi Connection

### PostgreSQL Connection di n8n
```
Type: PostgreSQL
Host: postgres
Port: 5432
Database: pbj_monitoring
User: pbj_user
Password: ${DB_PASSWORD}
SSL: false (internal network)
```

### Telegram Bot Connection
```
Type: Telegram
Bot Token: ${TELEGRAM_BOT_TOKEN}
```

### HTTP Connection (Puppeteer)
```
Type: HTTP Request
Base URL: http://puppeteer-service:3000
Timeout: 120000ms (2 menit)
```

---

## Credential Management

Semua credential disimpan di n8n credential store (encrypted):

| Credential Name | Type | Used In |
|----------------|------|---------|
| `PostgreSQL PBJ` | postgres | All workflows |
| `Telegram Bot PBJ` | telegram | All notification nodes |
| `Puppeteer API` | httpHeaderAuth | Scrape workflows |

---

## Monitoring n8n itu sendiri

### Health Check Endpoint
n8n expose `/healthz` untuk health check.

### Prometheus Metrics
Aktifkan `N8N_METRICS=true` untuk expose metrics di port 9119.

### Key Metrics:
- `n8n_workflow_executions_total` — total eksekusi
- `n8n_workflow_executions_duration_ms` — durasi eksekusi
- `n8n_workflow_executions_failed_total` — eksekusi gagal
- `n8n_workflow_execution_status` — status per workflow

### Alert Rules:
```yaml
# Scraping stuck (running > 10 min)
- alert: ScrapingStuck
  expr: n8n_workflow_executions_duration_ms{workflow="scrape-tahapan"} > 600000
  for: 5m

# High failure rate
- alert: HighScrapeFailureRate
  expr: rate(n8n_workflow_executions_failed_total{workflow="scrape-tahapan"}[1h]) > 0.5
  for: 15m
```
