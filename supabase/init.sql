-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  uuid VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  nickname VARCHAR(255),
  avatar_url TEXT,
  signin_type VARCHAR(50),
  signin_provider VARCHAR(50),
  signin_openid VARCHAR(255),
  signin_ip VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create credits table
CREATE TABLE IF NOT EXISTS credits (
  id SERIAL PRIMARY KEY,
  trans_no VARCHAR(255) UNIQUE NOT NULL,
  user_uuid VARCHAR(255) NOT NULL,
  trans_type VARCHAR(50) NOT NULL,
  credits INTEGER NOT NULL,
  order_no VARCHAR(255),
  expired_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_uuid) REFERENCES users(uuid) ON DELETE CASCADE
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_no VARCHAR(255) UNIQUE NOT NULL,
  user_uuid VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  product_name VARCHAR(255),
  amount DECIMAL(10, 2),
  credits INTEGER DEFAULT 0,
  currency VARCHAR(10),
  status VARCHAR(50),
  paid_at TIMESTAMP,
  expired_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_uuid) REFERENCES users(uuid) ON DELETE CASCADE
);

-- Create apikeys table
CREATE TABLE IF NOT EXISTS apikeys (
  id SERIAL PRIMARY KEY,
  user_uuid VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  key VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_uuid) REFERENCES users(uuid) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_uuid ON users(uuid);
CREATE INDEX IF NOT EXISTS idx_credits_user_uuid ON credits(user_uuid);
CREATE INDEX IF NOT EXISTS idx_credits_expired_at ON credits(expired_at);
CREATE INDEX IF NOT EXISTS idx_orders_user_uuid ON orders(user_uuid);
CREATE INDEX IF NOT EXISTS idx_apikeys_user_uuid ON apikeys(user_uuid);

-- Add RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE apikeys ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your needs)
-- For users table - users can only see their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = uuid);

-- For credits table - users can only see their own credits
CREATE POLICY "Users can view own credits" ON credits
  FOR SELECT USING (user_uuid IN (SELECT uuid FROM users WHERE auth.uid()::text = uuid));

-- For orders table - users can only see their own orders
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (user_uuid IN (SELECT uuid FROM users WHERE auth.uid()::text = uuid));

-- For apikeys table - users can only see their own API keys
CREATE POLICY "Users can view own apikeys" ON apikeys
  FOR SELECT USING (user_uuid IN (SELECT uuid FROM users WHERE auth.uid()::text = uuid));