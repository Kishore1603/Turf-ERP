-- ============================================================
-- TURF BOOKING ERP — SUPABASE SCHEMA
-- Run in Supabase SQL Editor
-- ============================================================

-- ── Enable UUID extension ────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ── TURFS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS turfs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  description TEXT,
  location    VARCHAR(200),
  amenities   TEXT[]        DEFAULT '{}',
  sport_types TEXT[]        DEFAULT '{}',
  image_url   TEXT,
  open_time   TIME          NOT NULL DEFAULT '06:00',
  close_time  TIME          NOT NULL DEFAULT '23:00',
  is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── CUSTOMERS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name            VARCHAR(100)  NOT NULL,
  phone           VARCHAR(20)   NOT NULL UNIQUE,
  email           VARCHAR(100),
  notes           TEXT,
  total_bookings  INTEGER       NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── PRICING RULES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pricing_rules (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  turf_id         UUID          NOT NULL REFERENCES turfs(id) ON DELETE CASCADE,
  name            VARCHAR(100)  NOT NULL,
  start_time      TIME          NOT NULL,
  end_time        TIME          NOT NULL,
  days_of_week    INTEGER[]     NOT NULL DEFAULT '{0,1,2,3,4,5,6}',
  price_per_hour  NUMERIC(10,2) NOT NULL CHECK (price_per_hour >= 0),
  is_peak         BOOLEAN       NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── BOOKINGS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_ref         VARCHAR(25)   NOT NULL UNIQUE,
  turf_id             UUID          NOT NULL REFERENCES turfs(id),
  customer_id         UUID          NOT NULL REFERENCES customers(id),
  booking_date        DATE          NOT NULL,
  start_time          TIME          NOT NULL,
  end_time            TIME          NOT NULL,
  duration_minutes    INTEGER       NOT NULL CHECK (duration_minutes > 0),
  total_amount        NUMERIC(10,2) NOT NULL DEFAULT 0,
  gst_amount          NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method      VARCHAR(20)   NOT NULL DEFAULT 'pending'
                        CHECK (payment_method IN ('online','venue','pending')),
  payment_status      VARCHAR(20)   NOT NULL DEFAULT 'pending'
                        CHECK (payment_status IN ('paid','pending','failed','refunded')),
  booking_status      VARCHAR(20)   NOT NULL DEFAULT 'confirmed'
                        CHECK (booking_status IN ('confirmed','cancelled','completed')),
  sport_type          VARCHAR(50),
  notes               TEXT,
  is_walk_in          BOOLEAN       NOT NULL DEFAULT FALSE,
  cancelled_at        TIMESTAMPTZ,
  cancellation_reason TEXT,
  refund_amount       NUMERIC(10,2),
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  -- Prevent overlapping active bookings on same turf
  CONSTRAINT no_overlap EXCLUDE USING GIST (
    turf_id WITH =,
    booking_date WITH =,
    tsrange(
      (booking_date + start_time)::TIMESTAMP,
      (booking_date + end_time)::TIMESTAMP
    ) WITH &&
  ) WHERE (booking_status != 'cancelled')
);

-- ── PAYMENTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id            UUID          NOT NULL REFERENCES bookings(id),
  amount                NUMERIC(10,2) NOT NULL,
  currency              VARCHAR(10)   NOT NULL DEFAULT 'INR',
  payment_method        VARCHAR(20)   NOT NULL
                          CHECK (payment_method IN ('razorpay','cash','upi','card')),
  razorpay_order_id     VARCHAR(100),
  razorpay_payment_id   VARCHAR(100),
  razorpay_signature    VARCHAR(300),
  status                VARCHAR(20)   NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','captured','failed','refunded')),
  failure_reason        TEXT,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── INVOICES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id       UUID          NOT NULL REFERENCES bookings(id) UNIQUE,
  invoice_number   VARCHAR(30)   NOT NULL UNIQUE,
  subtotal         NUMERIC(10,2) NOT NULL,
  gst_rate         NUMERIC(5,2)  NOT NULL DEFAULT 18,
  gst_amount       NUMERIC(10,2) NOT NULL,
  total_amount     NUMERIC(10,2) NOT NULL,
  business_name    VARCHAR(200),
  business_gstin   VARCHAR(20),
  customer_gstin   VARCHAR(20),
  pdf_url          TEXT,
  generated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_bookings_turf_date   ON bookings(turf_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_customer    ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date        ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status      ON bookings(booking_status, payment_status);
CREATE INDEX IF NOT EXISTS idx_pricing_turf         ON pricing_rules(turf_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking     ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone      ON customers(phone);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_turfs_updated_at
  BEFORE UPDATE ON turfs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-increment customer total_bookings
CREATE OR REPLACE FUNCTION increment_customer_bookings()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_status = 'confirmed' THEN
    UPDATE customers
    SET total_bookings = total_bookings + 1
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_booking_confirmed
  AFTER INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION increment_customer_bookings();

-- Revenue by date function (for dashboard RPC)
CREATE OR REPLACE FUNCTION get_revenue_by_date(days_back INTEGER DEFAULT 14)
RETURNS TABLE(date TEXT, revenue NUMERIC, bookings BIGINT)
LANGUAGE SQL AS $$
  SELECT
    to_char(b.booking_date, 'DD Mon') AS date,
    SUM(CASE WHEN b.payment_status = 'paid' THEN b.total_amount ELSE 0 END) AS revenue,
    COUNT(*) AS bookings
  FROM bookings b
  WHERE b.booking_date >= CURRENT_DATE - (days_back - 1)
    AND b.booking_status != 'cancelled'
  GROUP BY b.booking_date
  ORDER BY b.booking_date;
$$;

-- ============================================================
-- ROW LEVEL SECURITY (disable for admin-only MVP)
-- ============================================================
-- All tables are admin-only. Disable RLS and use service role key.
ALTER TABLE turfs          DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers      DISABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules  DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings       DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments       DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices       DISABLE ROW LEVEL SECURITY;
