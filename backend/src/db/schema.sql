-- Multi-Tier Affiliate Tracking Platform Schema for PostgreSQL

-- Drop if needed for clean re-runs
DROP TABLE IF EXISTS conversions_sales CASCADE;
DROP TABLE IF EXISTS clicks_traffic CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS brand_params CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS conversion_status CASCADE;

-- Create Enums
CREATE TYPE user_role AS ENUM ('admin', 'sub_aff');
CREATE TYPE conversion_status AS ENUM ('pending', 'approved', 'rejected');

-- 1. Users / Affiliates
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    mobile_number VARCHAR(30),
    status VARCHAR(20) NOT NULL DEFAULT 'inactive', -- 'active' or 'inactive'
    role user_role NOT NULL DEFAULT 'sub_aff',
    ref_code VARCHAR(64) UNIQUE NOT NULL,
    split_pct NUMERIC(5, 2) NOT NULL DEFAULT 60.00,
    wallet_pending NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    wallet_approved NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Brand Parameter Definitions Registry
CREATE TABLE brand_params (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_name VARCHAR(100) NOT NULL,
    master_aff_id VARCHAR(100) NOT NULL,
    url_template TEXT NOT NULL,
    click_id_param_key VARCHAR(50) NOT NULL DEFAULT 'click_ref',
    sub_ref_param_key VARCHAR(50) NOT NULL DEFAULT 'sub',
    postback_secret VARCHAR(255) NOT NULL,
    custom_params JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brand_params(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    destination_url TEXT NOT NULL,
    retail_price NUMERIC(10, 2) NOT NULL,
    default_comm_pct NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Inbound Traffic & Click ID Telemetry
CREATE TABLE clicks_traffic (
    click_id VARCHAR(64) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    ref_code VARCHAR(64) NOT NULL,
    src VARCHAR(100) DEFAULT 'direct',
    camp VARCHAR(100) DEFAULT 'default',
    sub1 VARCHAR(100),
    sub2 VARCHAR(100),
    ip_hash VARCHAR(64) NOT NULL,
    country VARCHAR(100) DEFAULT 'Unknown',
    city VARCHAR(100) DEFAULT 'Unknown',
    device VARCHAR(50) DEFAULT 'Desktop',
    os VARCHAR(50) DEFAULT 'Unknown',
    browser VARCHAR(50) DEFAULT 'Unknown',
    referrer TEXT,
    outbound_url TEXT NOT NULL,
    clicked_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_clicks_user_id ON clicks_traffic(user_id);
CREATE INDEX idx_clicks_product_id ON clicks_traffic(product_id);
CREATE INDEX idx_clicks_ref_code ON clicks_traffic(ref_code);
CREATE INDEX idx_clicks_clicked_at ON clicks_traffic(clicked_at);

-- 5. Conversions & Commission Split Ledger
CREATE TABLE conversions_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    click_id VARCHAR(64) UNIQUE NOT NULL REFERENCES clicks_traffic(click_id) ON DELETE RESTRICT,
    brand_order_id VARCHAR(120) NOT NULL,
    sale_amount NUMERIC(12, 2) NOT NULL,
    gross_comm NUMERIC(12, 2) NOT NULL,
    sub_pay NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    net_profit NUMERIC(12, 2) NOT NULL,
    status conversion_status NOT NULL DEFAULT 'pending',
    raw_payload JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_brand_order UNIQUE (brand_order_id)
);

CREATE INDEX idx_conversions_status ON conversions_sales(status);
CREATE INDEX idx_conversions_click_id ON conversions_sales(click_id);
CREATE INDEX idx_conversions_created_at ON conversions_sales(created_at);
