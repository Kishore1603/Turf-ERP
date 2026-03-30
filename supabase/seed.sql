-- ============================================================
-- SEED DATA — Run AFTER schema migration
-- ============================================================

-- ── Turfs ────────────────────────────────────────────────────
INSERT INTO turfs (id, name, description, location, amenities, sport_types, open_time, close_time)
VALUES
  (
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Turf A',
    'FIFA-standard football turf with LED floodlights. Perfect for 5-a-side and 7-a-side games.',
    'Block A, Sports Complex, Andheri West, Mumbai - 400053',
    ARRAY['Floodlights','Parking','Washrooms','Drinking Water'],
    ARRAY['Football','Cricket'],
    '06:00',
    '23:00'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO turfs (id, name, description, location, amenities, sport_types, open_time, close_time)
VALUES
  (
  (
    'aaaaaaaa-0000-0000-0000-000000000002',
    'Turf B',
    'Multi-sport synthetic turf ideal for badminton, tennis, and basketball.',
    'Block B, Sports Complex, Andheri West, Mumbai - 400053',
    ARRAY['Floodlights','Changing Rooms','Cafeteria','First Aid'],
    ARRAY['Badminton','Tennis','Basketball','Volleyball'],
    '07:00',
    '22:00'
  )
ON CONFLICT (id) DO NOTHING;

-- ── Pricing Rules ────────────────────────────────────────────
-- Turf A
INSERT INTO pricing_rules (turf_id, name, start_time, end_time, days_of_week, price_per_hour, is_peak)
VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Turf A – Morning',       '06:00', '11:00', ARRAY[1,2,3,4,5],   500,  FALSE),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Turf A – Day',           '11:00', '17:00', ARRAY[1,2,3,4,5],   600,  FALSE),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Turf A – Evening Peak',  '17:00', '21:00', ARRAY[1,2,3,4,5],   900,  TRUE),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Turf A – Night',         '21:00', '23:00', ARRAY[1,2,3,4,5],   700,  FALSE),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Turf A – Weekend All',   '06:00', '23:00', ARRAY[0,6],         1000, TRUE)
ON CONFLICT DO NOTHING;

-- Turf B
INSERT INTO pricing_rules (turf_id, name, start_time, end_time, days_of_week, price_per_hour, is_peak)
VALUES
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Turf B – Morning',       '07:00', '12:00', ARRAY[1,2,3,4,5],   400,  FALSE),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Turf B – Afternoon',     '12:00', '17:00', ARRAY[1,2,3,4,5],   500,  FALSE),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Turf B – Evening Peak',  '17:00', '21:00', ARRAY[1,2,3,4,5],   800,  TRUE),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Turf B – Weekend Peak',  '07:00', '22:00', ARRAY[0,6],         900,  TRUE)
ON CONFLICT DO NOTHING;

-- ── Sample Customers ─────────────────────────────────────────
INSERT INTO customers (id, name, phone, email)
VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', 'Arjun Sharma',   '9876543210', 'arjun@example.com'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'Priya Nair',     '9876543211', 'priya@example.com'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'Ravi Kumar',     '9876543212', NULL),
  ('bbbbbbbb-0000-0000-0000-000000000004', 'Sneha Patel',    '9876543213', 'sneha@example.com'),
  ('bbbbbbbb-0000-0000-0000-000000000005', 'Mohammed Ali',   '9876543214', NULL)
ON CONFLICT DO NOTHING;

-- ── Sample Bookings (today) ───────────────────────────────────
INSERT INTO bookings (
  booking_ref, turf_id, customer_id, booking_date,
  start_time, end_time, duration_minutes,
  total_amount, gst_amount,
  payment_method, payment_status, booking_status,
  sport_type, is_walk_in
)
VALUES
  (
    'TRF-SEED-001',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'bbbbbbbb-0000-0000-0000-000000000001',
    CURRENT_DATE, '09:00', '10:00', 60,
    590, 90, 'venue', 'paid', 'confirmed', 'Football', FALSE
  ),
  (
    'TRF-SEED-002',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'bbbbbbbb-0000-0000-0000-000000000002',
    CURRENT_DATE, '17:00', '18:30', 90,
    1593, 243, 'online', 'paid', 'confirmed', 'Football', FALSE
  ),
  (
    'TRF-SEED-003',
    'aaaaaaaa-0000-0000-0000-000000000002',
    'bbbbbbbb-0000-0000-0000-000000000003',
    CURRENT_DATE, '18:00', '20:00', 120,
    1888, 288, 'venue', 'pending', 'confirmed', 'Badminton', TRUE
  ),
  (
    'TRF-SEED-004',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'bbbbbbbb-0000-0000-0000-000000000004',
    CURRENT_DATE + INTERVAL '1 day', '10:00', '11:00', 60,
    708, 108, 'online', 'pending', 'confirmed', 'Cricket', FALSE
  )
ON CONFLICT (booking_ref) DO NOTHING;
