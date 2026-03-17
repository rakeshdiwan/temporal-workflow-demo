CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(64) UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  status VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS trips (
  id SERIAL PRIMARY KEY,
  trip_id UUID DEFAULT gen_random_uuid() UNIQUE,
  order_id VARCHAR(64) NOT NULL,
  driver_id VARCHAR(64),
  status VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  CONSTRAINT fk_order
    FOREIGN KEY(order_id)
      REFERENCES orders(order_id)
);

CREATE TABLE IF NOT EXISTS workflow_activity_log (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL,
  activity_name VARCHAR(128) NOT NULL,
  status VARCHAR(32) NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

