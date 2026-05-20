-- ============================================================
-- Trident IMS — Supabase Schema
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Vendors ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendors (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Hybrids ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hybrids (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL UNIQUE,
  category    TEXT CHECK (category IN ('TD', 'C', 'V', 'Other')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Processing Units ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS processing_units (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  location    TEXT DEFAULT 'Growhere',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Warehouses / Destinations ───────────────────────────────
CREATE TABLE IF NOT EXISTS warehouses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  type        TEXT DEFAULT 'external',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Dispatches (Main Transaction Table) ─────────────────────
CREATE TABLE IF NOT EXISTS dispatches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_no       INTEGER,
  dispatch_date   DATE NOT NULL,
  vendor_id       UUID REFERENCES vendors(id) ON DELETE SET NULL,
  hybrid_id       UUID REFERENCES hybrids(id) ON DELETE SET NULL,
  w_bridge_qty    NUMERIC,
  sheller_qty     NUMERIC,
  bags            TEXT,
  dc_number       TEXT,
  from_location   TEXT DEFAULT 'Growhere',
  to_warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  truck_number    TEXT,
  rst_number      TEXT,
  unit_id         UUID REFERENCES processing_units(id) ON DELETE SET NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Add computed raw_tonnage as a generated column
ALTER TABLE dispatches
  ADD COLUMN IF NOT EXISTS raw_tonnage NUMERIC
  GENERATED ALWAYS AS (w_bridge_qty / 1000.0) STORED;

-- ── Indexes for performance ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_dispatches_date        ON dispatches(dispatch_date DESC);
CREATE INDEX IF NOT EXISTS idx_dispatches_vendor      ON dispatches(vendor_id);
CREATE INDEX IF NOT EXISTS idx_dispatches_hybrid      ON dispatches(hybrid_id);
CREATE INDEX IF NOT EXISTS idx_dispatches_unit        ON dispatches(unit_id);
CREATE INDEX IF NOT EXISTS idx_dispatches_warehouse   ON dispatches(to_warehouse_id);

-- ============================================================
-- SEED DATA (from Excel analysis)
-- ============================================================

-- Vendors
INSERT INTO vendors (name) VALUES
  ('SUNRISE'),
  ('LG'),
  ('INDU'),
  ('SUNRICH'),
  ('YAGANTI')
ON CONFLICT (name) DO NOTHING;

-- Processing Units
INSERT INTO processing_units (name, location) VALUES
  ('Unit 1', 'Growhere'),
  ('Unit 2', 'Growhere'),
  ('Unit 3', 'Growhere')
ON CONFLICT (name) DO NOTHING;

-- Warehouses / Destinations
INSERT INTO warehouses (name, type) VALUES
  ('santhashi',          'external'),
  ('DRS Ware house',     'external'),
  ('gubba',              'external'),
  ('sanghis ware house', 'external'),
  ('LG',                 'vendor'),
  ('INDU',               'vendor'),
  ('sunrich',            'vendor')
ON CONFLICT (name) DO NOTHING;

-- Hybrids (TD Series)
INSERT INTO hybrids (code, category) VALUES
  ('TD-007',  'TD'),
  ('TD-101',  'TD'),
  ('TD-202',  'TD'),
  ('TD-303',  'TD'),
  ('TD-432',  'TD'),
  ('TD-505',  'TD'),
  ('TD-707',  'TD'),
  ('TD-909',  'TD'),
  ('TD-959',  'TD')
ON CONFLICT (code) DO NOTHING;

-- Hybrids (C Series)
INSERT INTO hybrids (code, category) VALUES
  ('C-3001',  'C'),
  ('C-3003',  'C'),
  ('C-3007',  'C'),
  ('C-3010',  'C'),
  ('C-3013',  'C'),
  ('C-3014',  'C'),
  ('C-3026',  'C'),
  ('C-3038',  'C'),
  ('C-3042',  'C'),
  ('C-3049',  'C'),
  ('C-3050',  'C'),
  ('C-3057',  'C'),
  ('C-3058',  'C'),
  ('C-3063',  'C'),
  ('C-3069',  'C'),
  ('C-3070',  'C')
ON CONFLICT (code) DO NOTHING;

-- Hybrids (V Series)
INSERT INTO hybrids (code, category) VALUES
  ('V-08',    'V'),
  ('V-117',   'V'),
  ('V-135',   'V'),
  ('V-155',   'V'),
  ('V-9035',  'V'),
  ('V-9055',  'V')
ON CONFLICT (code) DO NOTHING;

-- Hybrids (Other)
INSERT INTO hybrids (code, category) VALUES
  ('M32RED',  'Other')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- Row Level Security (optional — enable when you add auth)
-- ============================================================
-- ALTER TABLE dispatches ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE vendors    ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE hybrids    ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE processing_units ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
