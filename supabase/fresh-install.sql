-- ====================================
-- 全新安装脚本 - 创建所有表格
-- 在空数据库上执行此脚本
-- ====================================

-- 1. 用户表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    nickname VARCHAR(255),
    avatar_url VARCHAR(255),
    locale VARCHAR(50) DEFAULT 'en',
    signin_type VARCHAR(50),
    signin_ip VARCHAR(255),
    signin_provider VARCHAR(50),
    signin_openid VARCHAR(255),
    invite_code VARCHAR(255) NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    invited_by VARCHAR(255) NOT NULL DEFAULT '',
    is_affiliate BOOLEAN NOT NULL DEFAULT false,
    UNIQUE (email, signin_provider)
);

-- 2. 积分表
CREATE TABLE credits (
    id SERIAL PRIMARY KEY,
    trans_no VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    user_uuid VARCHAR(255) NOT NULL,
    trans_type VARCHAR(50) NOT NULL,
    credits INT NOT NULL,
    order_no VARCHAR(255),
    expired_at TIMESTAMPTZ,
    description TEXT,
    FOREIGN KEY (user_uuid) REFERENCES users(uuid) ON DELETE CASCADE
);

-- 3. 订单表
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_no VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    user_uuid VARCHAR(255) NOT NULL DEFAULT '',
    user_email VARCHAR(255) NOT NULL DEFAULT '',
    email VARCHAR(255),
    product_name VARCHAR(255),
    amount DECIMAL(10, 2),
    credits INT DEFAULT 0,
    currency VARCHAR(10),
    status VARCHAR(50),
    paid_at TIMESTAMPTZ,
    expired_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    interval VARCHAR(50),
    stripe_session_id VARCHAR(255),
    sub_id VARCHAR(255),
    sub_interval_count INT,
    sub_cycle_anchor INT,
    sub_period_end INT,
    sub_period_start INT,
    sub_times INT,
    product_id VARCHAR(255),
    valid_months INT,
    order_detail TEXT,
    paid_email VARCHAR(255),
    paid_detail TEXT,
    payment_provider VARCHAR(50),
    FOREIGN KEY (user_uuid) REFERENCES users(uuid) ON DELETE CASCADE
);

-- 4. API密钥表
CREATE TABLE apikeys (
    id SERIAL PRIMARY KEY,
    user_uuid VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    api_key VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_uuid) REFERENCES users(uuid) ON DELETE CASCADE
);

-- 5. 文章表
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(255) UNIQUE NOT NULL,
    slug VARCHAR(255),
    title VARCHAR(255),
    description TEXT,
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'draft',
    cover_url VARCHAR(255),
    author_name VARCHAR(255),
    author_avatar_url VARCHAR(255),
    locale VARCHAR(50) DEFAULT 'en',
    views INT DEFAULT 0,
    UNIQUE(slug, locale)
);

-- 6. 推广联盟表
CREATE TABLE affiliates (
    id SERIAL PRIMARY KEY,
    user_uuid VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    invited_by VARCHAR(255) NOT NULL,
    paid_order_no VARCHAR(255) NOT NULL DEFAULT '',
    paid_amount INT NOT NULL DEFAULT 0,
    reward_percent INT NOT NULL DEFAULT 30,
    reward_amount INT NOT NULL DEFAULT 0,
    paid_at TIMESTAMPTZ,
    FOREIGN KEY (user_uuid) REFERENCES users(uuid) ON DELETE CASCADE
);

-- 7. 反馈表
CREATE TABLE feedbacks (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending',
    user_uuid VARCHAR(255),
    content TEXT,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    reply TEXT,
    replied_at TIMESTAMPTZ,
    FOREIGN KEY (user_uuid) REFERENCES users(uuid) ON DELETE SET NULL
);

-- 8. 艺术作品表
CREATE TABLE artworks (
    id SERIAL PRIMARY KEY,
    artwork_id VARCHAR(255) UNIQUE NOT NULL,
    user_uuid VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    template_id VARCHAR(255) NOT NULL,
    template_name VARCHAR(255),
    template_category VARCHAR(100),
    generated_image_url TEXT NOT NULL,
    original_image_url TEXT,
    prompt TEXT,
    custom_requirements TEXT,
    aspect_ratio VARCHAR(50) DEFAULT '3:4',
    status VARCHAR(50) NOT NULL DEFAULT 'completed',
    credits_used INT NOT NULL DEFAULT 1,
    generation_time INT,
    is_public BOOLEAN DEFAULT false,
    likes INT DEFAULT 0,
    views INT DEFAULT 0,
    error_message TEXT,
    model_used VARCHAR(100),
    FOREIGN KEY (user_uuid) REFERENCES users(uuid) ON DELETE CASCADE
);

-- 9. 作品收藏表
CREATE TABLE artwork_favorites (
    id SERIAL PRIMARY KEY,
    user_uuid VARCHAR(255) NOT NULL,
    artwork_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_uuid, artwork_id),
    FOREIGN KEY (user_uuid) REFERENCES users(uuid) ON DELETE CASCADE,
    FOREIGN KEY (artwork_id) REFERENCES artworks(artwork_id) ON DELETE CASCADE
);

-- ====================================
-- 创建所有索引
-- ====================================

-- users 表索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_uuid ON users(uuid);
CREATE INDEX idx_users_invite_code ON users(invite_code);
CREATE INDEX idx_users_invited_by ON users(invited_by);

-- credits 表索引
CREATE INDEX idx_credits_user_uuid ON credits(user_uuid);
CREATE INDEX idx_credits_expired_at ON credits(expired_at);
CREATE INDEX idx_credits_trans_type ON credits(trans_type);
CREATE INDEX idx_credits_created_at ON credits(created_at DESC);

-- orders 表索引
CREATE INDEX idx_orders_user_uuid ON orders(user_uuid);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_payment_provider ON orders(payment_provider);

-- apikeys 表索引
CREATE INDEX idx_apikeys_user_uuid ON apikeys(user_uuid);
CREATE INDEX idx_apikeys_status ON apikeys(status);

-- posts 表索引
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_locale ON posts(locale);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- affiliates 表索引
CREATE INDEX idx_affiliates_user_uuid ON affiliates(user_uuid);
CREATE INDEX idx_affiliates_invited_by ON affiliates(invited_by);
CREATE INDEX idx_affiliates_status ON affiliates(status);

-- feedbacks 表索引
CREATE INDEX idx_feedbacks_user_uuid ON feedbacks(user_uuid);
CREATE INDEX idx_feedbacks_status ON feedbacks(status);
CREATE INDEX idx_feedbacks_created_at ON feedbacks(created_at DESC);

-- artworks 表索引
CREATE INDEX idx_artworks_user_uuid ON artworks(user_uuid);
CREATE INDEX idx_artworks_created_at ON artworks(created_at DESC);
CREATE INDEX idx_artworks_is_public ON artworks(is_public);
CREATE INDEX idx_artworks_template_id ON artworks(template_id);
CREATE INDEX idx_artworks_status ON artworks(status);
CREATE INDEX idx_artworks_likes ON artworks(likes DESC);
CREATE INDEX idx_artworks_views ON artworks(views DESC);

-- artwork_favorites 表索引
CREATE INDEX idx_favorites_user_uuid ON artwork_favorites(user_uuid);
CREATE INDEX idx_favorites_artwork_id ON artwork_favorites(artwork_id);
CREATE INDEX idx_favorites_created_at ON artwork_favorites(created_at DESC);

-- ====================================
-- 创建函数和触发器
-- ====================================

-- 自动更新 updated_at 字段的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 增加作品浏览量的函数
CREATE OR REPLACE FUNCTION increment_artwork_views(p_artwork_id VARCHAR)
RETURNS VOID AS $$
BEGIN
    UPDATE artworks 
    SET views = views + 1 
    WHERE artwork_id = p_artwork_id;
END;
$$ LANGUAGE plpgsql;

-- 增加作品点赞数的函数
CREATE OR REPLACE FUNCTION increment_artwork_likes(p_artwork_id VARCHAR)
RETURNS VOID AS $$
BEGIN
    UPDATE artworks 
    SET likes = likes + 1 
    WHERE artwork_id = p_artwork_id;
END;
$$ LANGUAGE plpgsql;

-- 获取用户剩余积分的函数
CREATE OR REPLACE FUNCTION get_user_credits(p_user_uuid VARCHAR)
RETURNS INT AS $$
DECLARE
    total_credits INT;
BEGIN
    SELECT COALESCE(SUM(
        CASE 
            WHEN trans_type IN ('add', 'refund') THEN credits
            WHEN trans_type = 'deduct' THEN -credits
            ELSE 0
        END
    ), 0) INTO total_credits
    FROM credits
    WHERE user_uuid = p_user_uuid
    AND (expired_at IS NULL OR expired_at > CURRENT_TIMESTAMP);
    
    RETURN total_credits;
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- 启用 Row Level Security
-- ====================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE apikeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE artwork_favorites ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略（service role 完全访问）
CREATE POLICY "Service role users" ON users FOR ALL USING (true);
CREATE POLICY "Service role credits" ON credits FOR ALL USING (true);
CREATE POLICY "Service role orders" ON orders FOR ALL USING (true);
CREATE POLICY "Service role apikeys" ON apikeys FOR ALL USING (true);
CREATE POLICY "Service role posts" ON posts FOR ALL USING (true);
CREATE POLICY "Service role affiliates" ON affiliates FOR ALL USING (true);
CREATE POLICY "Service role feedbacks" ON feedbacks FOR ALL USING (true);
CREATE POLICY "Service role artworks" ON artworks FOR ALL USING (true);
CREATE POLICY "Service role favorites" ON artwork_favorites FOR ALL USING (true);

-- ====================================
-- 完成！
-- ====================================