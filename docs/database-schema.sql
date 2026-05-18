-- =============================================================
-- Sistem Monitoring Pengadaan Barang/Jasa
-- Database Schema - PostgreSQL 15+
-- =============================================================

-- Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- ENUMS
-- =============================================================

CREATE TYPE user_role AS ENUM ('admin', 'supervisor', 'auditor');

CREATE TYPE paket_status AS ENUM (
    'DRAFT',
    'AKTIF',
    'SELESAI',
    'DIBATALKAN'
);

CREATE TYPE tahapan_status AS ENUM (
    'NOT_STARTED',
    'IN_PROGRESS',
    'COMPLETED',
    'SKIPPED'
);

CREATE TYPE scraping_status AS ENUM (
    'PENDING',
    'RUNNING',
    'SUCCESS',
    'FAILED',
    'TIMEOUT'
);

CREATE TYPE notif_type AS ENUM (
    'STATUS_CHANGE',
    'SCRAPE_COMPLETE',
    'SCRAPE_FAILED',
    'DAILY_SUMMARY',
    'ERROR_ALERT'
);

-- =============================================================
-- TABEL: users
-- =============================================================

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username        VARCHAR(100) NOT NULL UNIQUE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    role            user_role NOT NULL DEFAULT 'admin',
    telegram_chat_id VARCHAR(100),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- =============================================================
-- TABEL: kategori_pengadaan
-- =============================================================

CREATE TABLE kategori_pengadaan (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama        VARCHAR(255) NOT NULL UNIQUE,
    kode        VARCHAR(50) NOT NULL UNIQUE,
    deskripsi   TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed data kategori
INSERT INTO kategori_pengadaan (nama, kode, deskripsi) VALUES
    ('Pengadaan Barang', 'BARANG', 'Pengadaan barang-barang fisik'),
    ('Jasa Konsultansi', 'JASA_KONSULTANSI', 'Jasa konsultansi perencanaan/pengawasan'),
    ('Jasa Lainnya', 'JASA_LAINNYA', 'Jasa non-konsultansi'),
    ('Pekerjaan Konstruksi', 'KONSTRUKSI', 'Pekerjaan konstruksi/bangunan');

-- =============================================================
-- TABEL: paket_pengadaan
-- =============================================================

CREATE TABLE paket_pengadaan (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama_paket          VARCHAR(500) NOT NULL,
    kode_paket          VARCHAR(100),
    url_lpse            VARCHAR(1000) NOT NULL,
    url_ekatalog        VARCHAR(1000),
    sumber_data         VARCHAR(100) DEFAULT 'LPSE',
    kategori_id         UUID REFERENCES kategori_pengadaan(id) ON DELETE SET NULL,
    pagu_anggaran       DECIMAL(18,2),
    hps_nilai           DECIMAL(18,2),
    tahun_anggaran      INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
    satuan_kerja        VARCHAR(255),
    lokasi_pekerjaan    TEXT,
    keterangan          TEXT,
    status              paket_status NOT NULL DEFAULT 'DRAFT',
    current_tahapan     SMALLINT DEFAULT 0,
    created_by          UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_paket_status ON paket_pengadaan(status);
CREATE INDEX idx_paket_kategori ON paket_pengadaan(kategori_id);
CREATE INDEX idx_paket_tahun ON paket_pengadaan(tahun_anggaran);
CREATE INDEX idx_paket_created_by ON paket_pengadaan(created_by);
CREATE INDEX idx_paket_kode ON paket_pengadaan(kode_paket);

-- =============================================================
-- TABEL: tahapan_sop
-- =============================================================

CREATE TABLE tahapan_sop (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paket_id            UUID NOT NULL REFERENCES paket_pengadaan(id) ON DELETE CASCADE,
    nomor_tahapan       SMALLINT NOT NULL CHECK (nomor_tahapan BETWEEN 1 AND 16),
    nama_tahapan        VARCHAR(255) NOT NULL,
    status              tahapan_status NOT NULL DEFAULT 'NOT_STARTED',
    screenshot_path     VARCHAR(500),
    screenshot_url      VARCHAR(1000),
    extracted_links     JSONB DEFAULT '[]'::JSONB,
    notes               TEXT,
    started_at          TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_tahapan_paket_nomor UNIQUE (paket_id, nomor_tahapan)
);

CREATE INDEX idx_tahapan_paket ON tahapan_sop(paket_id);
CREATE INDEX idx_tahapan_status ON tahapan_sop(status);
CREATE INDEX idx_tahapan_nomor ON tahapan_sop(nomor_tahapan);

-- =============================================================
-- TABEL: scraping_jobs
-- =============================================================

CREATE TABLE scraping_jobs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paket_id            UUID NOT NULL REFERENCES paket_pengadaan(id) ON DELETE CASCADE,
    tahapan_nomor       SMALLINT,
    url_target          VARCHAR(1000) NOT NULL,
    status              scraping_status NOT NULL DEFAULT 'PENDING',
    screenshot_path     VARCHAR(500),
    extracted_data      JSONB DEFAULT '{}'::JSONB,
    extracted_links     JSONB DEFAULT '[]'::JSONB,
    error_message       TEXT,
    retry_count         SMALLINT DEFAULT 0,
    max_retries         SMALLINT DEFAULT 3,
    started_at          TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    duration_ms         INTEGER,
    triggered_by        UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_scraping_paket ON scraping_jobs(paket_id);
CREATE INDEX idx_scraping_status ON scraping_jobs(status);
CREATE INDEX idx_scraping_created ON scraping_jobs(created_at);

-- =============================================================
-- TABEL: notifications
-- =============================================================

CREATE TABLE notifications (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type                notif_type NOT NULL,
    title               VARCHAR(255) NOT NULL,
    message             TEXT NOT NULL,
    data                JSONB DEFAULT '{}'::JSONB,
    is_read             BOOLEAN NOT NULL DEFAULT false,
    telegram_sent       BOOLEAN NOT NULL DEFAULT false,
    telegram_message_id VARCHAR(100),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at             TIMESTAMPTZ
);

CREATE INDEX idx_notif_user ON notifications(user_id);
CREATE INDEX idx_notif_type ON notifications(type);
CREATE INDEX idx_notif_read ON notifications(is_read);
CREATE INDEX idx_notif_created ON notifications(created_at);

-- =============================================================
-- TABEL: activity_logs
-- =============================================================

CREATE TABLE activity_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    action          VARCHAR(100) NOT NULL,
    entity_type     VARCHAR(50) NOT NULL,
    entity_id       UUID,
    description     TEXT,
    metadata        JSONB DEFAULT '{}'::JSONB,
    ip_address      INET,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_user ON activity_logs(user_id);
CREATE INDEX idx_activity_action ON activity_logs(action);
CREATE INDEX idx_activity_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_created ON activity_logs(created_at);

-- =============================================================
-- TABEL: scraping_schedules
-- =============================================================

CREATE TABLE scraping_schedules (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paket_id        UUID NOT NULL REFERENCES paket_pengadaan(id) ON DELETE CASCADE,
    cron_expression VARCHAR(100) NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    last_run_at     TIMESTAMPTZ,
    next_run_at     TIMESTAMPTZ,
    created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_schedule_paket ON scraping_schedules(paket_id);
CREATE INDEX idx_schedule_active ON scraping_schedules(is_active);

-- =============================================================
-- FUNCTION: auto_create_tahapan
-- Trigger untuk auto-create 16 tahapan saat paket baru dibuat
-- =============================================================

CREATE OR REPLACE FUNCTION auto_create_tahapan()
RETURNS TRIGGER AS $$
DECLARE
    tahapan_names VARCHAR(255)[] := ARRAY[
        'Penyusunan Rencana Umum Pengadaan',
        'Penyusunan Rencana Implementasi Pengadaan',
        'Penetapan Metode dan Rancangan Dokumen Pengadaan',
        'Penyiapan Dokumen Pengadaan',
        'Pengadaan Tanpa Tender / Tender',
        'Penjelasan Dokumen Pengadaan',
        'Pemasukan Dokumen Penawaran',
        'Evaluasi Dokumen Penawaran',
        'Negosiasi dan Penetapan Pemenang',
        'Penetapan Pemenang',
        'Penandatanganan Kontrak',
        'Pelaksanaan Pekerjaan',
        'Serah Terima Pekerjaan',
        'Pembayaran',
        'Pemeliharaan',
        'Penyelesaian Akhir'
    ];
    i INTEGER;
BEGIN
    FOR i IN 1..16 LOOP
        INSERT INTO tahapan_sop (paket_id, nomor_tahapan, nama_tahapan)
        VALUES (NEW.id, i, tahapan_names[i]);
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_create_tahapan
    AFTER INSERT ON paket_pengadaan
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_tahapan();

-- =============================================================
-- FUNCTION: update_updated_at
-- Auto-update updated_at timestamp
-- =============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_paket_updated_at
    BEFORE UPDATE ON paket_pengadaan
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_tahapan_updated_at
    BEFORE UPDATE ON tahapan_sop
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_schedule_updated_at
    BEFORE UPDATE ON scraping_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================
-- FUNCTION: notify_status_change
-- Trigger untuk create notification saat status tahapan berubah
-- =============================================================

CREATE OR REPLACE FUNCTION notify_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO notifications (user_id, type, title, message, data)
        SELECT
            u.id,
            'STATUS_CHANGE',
            'Status Tahapan Berubah',
            format('Paket: %s | Tahapan %s: %s → %s',
                p.nama_paket,
                NEW.nomor_tahapan,
                OLD.status,
                NEW.status
            ),
            jsonb_build_object(
                'paket_id', NEW.paket_id,
                'tahapan_nomor', NEW.nomor_tahapan,
                'old_status', OLD.status::text,
                'new_status', NEW.status::text
            )
        FROM paket_pengadaan p
        CROSS JOIN users u
        WHERE p.id = NEW.paket_id
          AND u.is_active = true
          AND u.role IN ('admin', 'supervisor');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_status_change
    AFTER UPDATE ON tahapan_sop
    FOR EACH ROW
    EXECUTE FUNCTION notify_status_change();

-- =============================================================
-- VIEWS
-- =============================================================

-- Dashboard overview
CREATE VIEW vw_dashboard_stats AS
SELECT
    (SELECT count(*) FROM paket_pengadaan) AS total_paket,
    (SELECT count(*) FROM paket_pengadaan WHERE status = 'AKTIF') AS paket_aktif,
    (SELECT count(*) FROM paket_pengadaan WHERE status = 'SELESAI') AS paket_selesai,
    (SELECT count(*) FROM paket_pengadaan WHERE status = 'DRAFT') AS paket_draft,
    (SELECT count(*) FROM paket_pengadaan WHERE status = 'DIBATALKAN') AS paket_dibatalkan,
    (SELECT count(*) FROM scraping_jobs WHERE status = 'RUNNING') AS scraping_running,
    (SELECT count(*) FROM scraping_jobs WHERE status = 'FAILED' AND created_at > now() - interval '24 hours') AS scraping_failed_24h,
    (SELECT count(*) FROM notifications WHERE is_read = false) AS unread_notifications;

-- Paket dengan progress
CREATE VIEW vw_paket_progress AS
SELECT
    p.id,
    p.nama_paket,
    p.kode_paket,
    p.status,
    p.current_tahapan,
    p.tahun_anggaran,
    p.pagu_anggaran,
    k.nama AS kategori_nama,
    COUNT(t.id) AS total_tahapan,
    COUNT(CASE WHEN t.status = 'COMPLETED' THEN 1 END) AS completed_tahapan,
    COUNT(CASE WHEN t.status = 'IN_PROGRESS' THEN 1 END) AS in_progress_tahapan,
    COUNT(CASE WHEN t.status = 'NOT_STARTED' THEN 1 END) AS not_started_tahapan,
    ROUND(
        COUNT(CASE WHEN t.status = 'COMPLETED' THEN 1 END)::numeric /
        NULLIF(COUNT(t.id)::numeric, 0) * 100
    , 1) AS progress_pct,
    p.updated_at
FROM paket_pengadaan p
LEFT JOIN tahapan_sop t ON t.paket_id = p.id
LEFT JOIN kategori_pengadaan k ON k.id = p.kategori_id
GROUP BY p.id, p.nama_paket, p.kode_paket, p.status, p.current_tahapan,
         p.tahun_anggaran, p.pagu_anggaran, k.nama, p.updated_at;

-- =============================================================
-- SEED DATA: Admin user
-- Password: admin123 (bcrypt hash)
-- =============================================================

INSERT INTO users (username, email, password_hash, full_name, role) VALUES
    ('admin', 'admin@pbj.local',
     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
     'Administrator', 'admin');
