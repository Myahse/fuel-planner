CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);

CREATE TYPE fuel_type AS ENUM ('petrol', 'diesel', 'hybrid');

CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INT NOT NULL CHECK (year >= 1900 AND year <= 2100),
    engine TEXT NOT NULL DEFAULT '',
    fuel_type fuel_type NOT NULL DEFAULT 'petrol',
    tank_capacity_liters NUMERIC(8,2) NOT NULL CHECK (tank_capacity_liters > 0),
    city_consumption NUMERIC(8,2),
    highway_consumption NUMERIC(8,2),
    mixed_consumption NUMERIC(8,2) NOT NULL CHECK (mixed_consumption > 0),
    fuel_gauge_bars INT NOT NULL DEFAULT 10 CHECK (fuel_gauge_bars >= 4 AND fuel_gauge_bars <= 20),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);

CREATE TABLE fuel_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE UNIQUE,
    fuel_percentage NUMERIC(5,2) NOT NULL CHECK (fuel_percentage >= 0 AND fuel_percentage <= 100),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fuel_levels_user_id ON fuel_levels(user_id);

CREATE TABLE fuel_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fuel_type fuel_type NOT NULL,
    price_per_liter NUMERIC(12,2) NOT NULL CHECK (price_per_liter > 0),
    currency TEXT NOT NULL DEFAULT 'FCFA',
    country_code TEXT NOT NULL DEFAULT 'CI',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_fuel_prices_user_type_active
    ON fuel_prices (user_id, fuel_type)
    WHERE is_active = TRUE;

CREATE TABLE fuel_stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    brand TEXT NOT NULL DEFAULT '',
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT NOT NULL DEFAULT '',
    country_code TEXT NOT NULL DEFAULT 'CI',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE fuel_station_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID NOT NULL REFERENCES fuel_stations(id) ON DELETE CASCADE,
    fuel_type fuel_type NOT NULL,
    price_per_liter NUMERIC(12,2) NOT NULL CHECK (price_per_liter > 0),
    currency TEXT NOT NULL DEFAULT 'FCFA',
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fuel_station_prices_station ON fuel_station_prices(station_id);

CREATE TABLE fuel_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    station_id UUID REFERENCES fuel_stations(id) ON DELETE SET NULL,
    liters NUMERIC(10,3) NOT NULL CHECK (liters > 0),
    price_per_liter NUMERIC(12,2) NOT NULL CHECK (price_per_liter > 0),
    total_amount NUMERIC(14,2) NOT NULL CHECK (total_amount > 0),
    fuel_type fuel_type NOT NULL,
    odometer NUMERIC(12,1),
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fuel_transactions_user_vehicle ON fuel_transactions(user_id, vehicle_id);

CREATE TYPE trip_type AS ENUM ('one_way', 'round_trip', 'multi_stop');
CREATE TYPE trip_status AS ENUM ('planned', 'active', 'completed', 'cancelled');

CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    origin_label TEXT NOT NULL,
    destination_label TEXT NOT NULL,
    origin_lat DOUBLE PRECISION,
    origin_lng DOUBLE PRECISION,
    destination_lat DOUBLE PRECISION,
    destination_lng DOUBLE PRECISION,
    distance_km NUMERIC(10,2) NOT NULL DEFAULT 0,
    estimated_duration_seconds INT NOT NULL DEFAULT 0,
    fuel_required_liters NUMERIC(10,3) NOT NULL DEFAULT 0,
    fuel_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
    starting_fuel_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
    starting_fuel_liters_est NUMERIC(10,3) NOT NULL DEFAULT 0,
    ending_fuel_liters_est NUMERIC(10,3),
    actual_fuel_used_liters NUMERIC(10,3),
    trip_type trip_type NOT NULL DEFAULT 'one_way',
    status trip_status NOT NULL DEFAULT 'planned',
    consumption_profile TEXT NOT NULL DEFAULT 'mixed',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trips_user_id ON trips(user_id);

CREATE TABLE trip_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    sequence INT NOT NULL,
    label TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    UNIQUE (trip_id, sequence)
);

CREATE TABLE trip_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE UNIQUE,
    provider TEXT NOT NULL DEFAULT 'mock',
    polyline TEXT NOT NULL DEFAULT '',
    raw_json JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    country_code TEXT NOT NULL DEFAULT 'CI',
    currency TEXT NOT NULL DEFAULT 'FCFA',
    distance_unit TEXT NOT NULL DEFAULT 'km',
    consumption_unit TEXT NOT NULL DEFAULT 'L/100km',
    language TEXT NOT NULL DEFAULT 'en',
    theme TEXT NOT NULL DEFAULT 'system',
    notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    default_fuel_price NUMERIC(12,2) NOT NULL DEFAULT 875,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
