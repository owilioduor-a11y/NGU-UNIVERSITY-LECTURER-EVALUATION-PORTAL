-- =========================================================================
-- NGU Lecturer Evaluation Portal - SQLite schema
-- -------------------------------------------------------------------------
-- Flask-SQLAlchemy creates these tables automatically on first run; this file
-- documents the schema and allows manual/DB-tool initialization.
-- Run with:  sqlite3 database/app.db < database/schema.sql
-- =========================================================================

PRAGMA foreign_keys = ON;

-- -------------------------------------------------------------------------
-- Users (students and administrators)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          VARCHAR(120) NOT NULL,
    email         VARCHAR(180) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'student',
    created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role  ON users (role);

-- -------------------------------------------------------------------------
-- Lecturers
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lecturers (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       VARCHAR(120) NOT NULL UNIQUE,
    department VARCHAR(120) NOT NULL DEFAULT 'General',
    pin_hash   VARCHAR(255),
    created_at DATETIME     DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lecturers_name ON lecturers (name);
CREATE INDEX IF NOT EXISTS idx_lecturers_department ON lecturers (department);

-- -------------------------------------------------------------------------
-- Reviews
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    student_name  VARCHAR(120) NOT NULL DEFAULT 'Anonymous',
    student_email VARCHAR(180),
    lecturer_id   INTEGER      NOT NULL,
    unit          VARCHAR(180) NOT NULL,
    score         INTEGER      NOT NULL CHECK (score BETWEEN 0 AND 100),
    comment       TEXT,
    sentiment     VARCHAR(20)  NOT NULL DEFAULT 'neutral',
    created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lecturer_id) REFERENCES lecturers (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reviews_lecturer ON reviews (lecturer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_email    ON reviews (student_email);
CREATE INDEX IF NOT EXISTS idx_reviews_created  ON reviews (created_at);

-- -------------------------------------------------------------------------
-- Seed lecturers
-- -------------------------------------------------------------------------
INSERT OR IGNORE INTO lecturers (name, department) VALUES
    ('Dr. Matin',      'Computing & AI'),
    ('Prof. Kwesi',    'Computing & AI'),
    ('Dr. Owili',      'Engineering'),
    ('Prof. Njeri',    'Engineering'),
    ('Dr. Rodriguez',  'Leadership'),
    ('Dr. Sang',       'Computing & AI'),
    ('Prof. Okello',   'Engineering'),
    ('Dr. Amina',      'Leadership'),
    ('Dr. Mutua',      'Computing & AI'),
    ('Prof. Zhao',     'Engineering');
