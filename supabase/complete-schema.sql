-- ====================================
-- 完整的数据库初始化脚本
-- ====================================

-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
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
CREATE TABLE IF NOT EXISTS credits (
    id SERIAL PRIMARY KEY,
    trans_no VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    user_uuid VARCHAR(255) NOT NULL,
    trans_type VARCHAR(50) NOT NULL, -- 'add', 'deduct', 'refund'
    credits INT NOT NULL,
    order_no VARCHAR(255),
    expired_at TIMESTAMPTZ,
    description TEXT,
    FOREIGN KEY (user_uuid) REFERENCES users(uuid) ON DELETE CASCADE
);

-- 3. 订单表
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_no VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    user_uuid VARCHAR(255) NOT NULL DEFAULT '',
    user_email VARCHAR(255) NOT NULL DEFAULT '',
    amount INT NOT NULL,
    interval VARCHAR(50),
    expired_at TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL, -- 'pending', 'paid', 'failed', 'cancelled', 'refunded'
    stripe_session_id VARCHAR(255),
    credits INT NOT NULL,
    currency VARCHAR(50) DEFAULT 'USD',
    sub_id VARCHAR(255),
    sub_interval_count INT,
    sub_cycle_anchor INT,
    sub_period_end INT,
    sub_period_start INT,
    sub_times INT,
    product_id VARCHAR(255),
    product_name VARCHAR(255),
    valid_months INT,
    order_detail TEXT,
    paid_at TIMESTAMPTZ,
    paid_email VARCHAR(255),
    paid_detail TEXT,
    payment_provider VARCHAR(50), -- 'stripe', 'creem'
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. API密钥表
CREATE TABLE IF NOT EXISTS apikeys (
    id SERIAL PRIMARY KEY,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(100),
    user_uuid VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'expired'
    last_used_at TIMESTAMPTZ,
    FOREIGN KEY (user_uuid) REFERENCES users(uuid) ON DELETE CASCADE
);

-- 5. 文章表
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(255) UNIQUE NOT NULL,
    slug VARCHAR(255),
    title VARCHAR(255),
    description TEXT,
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'published', 'archived'
    cover_url VARCHAR(255),
    author_name VARCHAR(255),
    author_avatar_url VARCHAR(255),
    locale VARCHAR(50) DEFAULT 'en',
    views INT DEFAULT 0,
    UNIQUE(slug, locale)
);

-- 6. 推广联盟表
CREATE TABLE IF NOT EXISTS affiliates (
    id SERIAL PRIMARY KEY,
    user_uuid VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'paid'
    invited_by VARCHAR(255) NOT NULL,
    paid_order_no VARCHAR(255) NOT NULL DEFAULT '',
    paid_amount INT NOT NULL DEFAULT 0,
    reward_percent INT NOT NULL DEFAULT 30,
    reward_amount INT NOT NULL DEFAULT 0,
    paid_at TIMESTAMPTZ,
    FOREIGN KEY (user_uuid) REFERENCES users(uuid) ON DELETE CASCADE
);

-- 7. 反馈表
CREATE TABLE IF NOT EXISTS feedbacks (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'resolved', 'archived'
    user_uuid VARCHAR(255),
    content TEXT,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    reply TEXT,
    replied_at TIMESTAMPTZ,
    FOREIGN KEY (user_uuid) REFERENCES users(uuid) ON DELETE SET NULL
);

-- 8. 艺术作品表（生图记录）
CREATE TABLE IF NOT EXISTS artworks (
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
    status VARCHAR(50) NOT NULL DEFAULT 'completed', -- 'pending', 'processing', 'completed', 'failed'
    credits_used INT NOT NULL DEFAULT 1,
    generation_time INT, -- 生成耗时（毫秒）
    is_public BOOLEAN DEFAULT false, -- 是否公开展示
    likes INT DEFAULT 0,
    views INT DEFAULT 0,
    error_message TEXT, -- 失败时的错误信息
    model_used VARCHAR(100), -- 使用的AI模型
    FOREIGN KEY (user_uuid) REFERENCES users(uuid) ON DELETE CASCADE
);

-- 9. 作品收藏表
CREATE TABLE IF NOT EXISTS artwork_favorites (
    id SERIAL PRIMARY KEY,
    user_uuid VARCHAR(255) NOT NULL,
    artwork_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_uuid, artwork_id),
    FOREIGN KEY (user_uuid) REFERENCES users(uuid) ON DELETE CASCADE,
    FOREIGN KEY (artwork_id) REFERENCES artworks(artwork_id) ON DELETE CASCADE
);

-- ====================================
-- 创建索引以提升查询性能
-- ====================================

-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_uuid ON users(uuid);
CREATE INDEX IF NOT EXISTS idx_users_invite_code ON users(invite_code);
CREATE INDEX IF NOT EXISTS idx_users_invited_by ON users(invited_by);

-- 积分表索引
CREATE INDEX IF NOT EXISTS idx_credits_user_uuid ON credits(user_uuid);
CREATE INDEX IF NOT EXISTS idx_credits_expired_at ON credits(expired_at);
CREATE INDEX IF NOT EXISTS idx_credits_trans_type ON credits(trans_type);
CREATE INDEX IF NOT EXISTS idx_credits_created_at ON credits(created_at DESC);

-- 订单表索引
CREATE INDEX IF NOT EXISTS idx_orders_user_uuid ON orders(user_uuid);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_provider ON orders(payment_provider);

-- API密钥表索引
CREATE INDEX IF NOT EXISTS idx_apikeys_user_uuid ON apikeys(user_uuid);
CREATE INDEX IF NOT EXISTS idx_apikeys_status ON apikeys(status);

-- 文章表索引
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_locale ON posts(locale);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- 推广联盟表索引
CREATE INDEX IF NOT EXISTS idx_affiliates_user_uuid ON affiliates(user_uuid);
CREATE INDEX IF NOT EXISTS idx_affiliates_invited_by ON affiliates(invited_by);
CREATE INDEX IF NOT EXISTS idx_affiliates_status ON affiliates(status);

-- 反馈表索引
CREATE INDEX IF NOT EXISTS idx_feedbacks_user_uuid ON feedbacks(user_uuid);
CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks(status);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON feedbacks(created_at DESC);

-- 艺术作品表索引
CREATE INDEX IF NOT EXISTS idx_artworks_user_uuid ON artworks(user_uuid);
CREATE INDEX IF NOT EXISTS idx_artworks_created_at ON artworks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_artworks_is_public ON artworks(is_public);
CREATE INDEX IF NOT EXISTS idx_artworks_template_id ON artworks(template_id);
CREATE INDEX IF NOT EXISTS idx_artworks_status ON artworks(status);
CREATE INDEX IF NOT EXISTS idx_artworks_likes ON artworks(likes DESC);
CREATE INDEX IF NOT EXISTS idx_artworks_views ON artworks(views DESC);

-- 收藏表索引
CREATE INDEX IF NOT EXISTS idx_favorites_user_uuid ON artwork_favorites(user_uuid);
CREATE INDEX IF NOT EXISTS idx_favorites_artwork_id ON artwork_favorites(artwork_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON artwork_favorites(created_at DESC);

-- ====================================
-- 创建存储过程和函数
-- ====================================

-- 自动更新 updated_at 字段的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要 updated_at 的表创建触发器
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

-- 减少作品点赞数的函数
CREATE OR REPLACE FUNCTION decrement_artwork_likes(p_artwork_id VARCHAR)
RETURNS VOID AS $$
BEGIN
    UPDATE artworks 
    SET likes = GREATEST(0, likes - 1)
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
-- 创建视图
-- ====================================

-- 用户积分汇总视图
CREATE OR REPLACE VIEW user_credits_summary AS
SELECT 
    u.uuid,
    u.email,
    u.nickname,
    COALESCE(SUM(
        CASE 
            WHEN c.trans_type IN ('add', 'refund') THEN c.credits
            WHEN c.trans_type = 'deduct' THEN -c.credits
            ELSE 0
        END
    ), 0) as total_credits,
    COUNT(DISTINCT a.artwork_id) as total_artworks,
    COALESCE(SUM(a.credits_used), 0) as total_credits_used
FROM users u
LEFT JOIN credits c ON u.uuid = c.user_uuid 
    AND (c.expired_at IS NULL OR c.expired_at > CURRENT_TIMESTAMP)
LEFT JOIN artworks a ON u.uuid = a.user_uuid AND a.status = 'completed'
GROUP BY u.uuid, u.email, u.nickname;

-- 热门作品视图
CREATE OR REPLACE VIEW trending_artworks AS
SELECT 
    a.*,
    u.email as user_email,
    u.nickname as user_nickname,
    u.avatar_url as user_avatar_url,
    (a.likes * 2 + a.views) as popularity_score
FROM artworks a
JOIN users u ON a.user_uuid = u.uuid
WHERE a.is_public = true 
    AND a.status = 'completed'
ORDER BY popularity_score DESC, a.created_at DESC;

-- ====================================
-- Row Level Security (RLS) 策略
-- ====================================

-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE apikeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE artwork_favorites ENABLE ROW LEVEL SECURITY;

-- 创建服务角色的策略（允许完全访问）
CREATE POLICY "Service role can access all data" ON users
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all credits" ON credits
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all orders" ON orders
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all apikeys" ON apikeys
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all artworks" ON artworks
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all favorites" ON artwork_favorites
    FOR ALL USING (auth.role() = 'service_role');

-- ====================================
-- 初始数据（可选）
-- ====================================

-- 插入默认的管理员用户（根据需要修改）
-- INSERT INTO users (uuid, email, nickname, is_affiliate) 
-- VALUES ('admin-uuid', 'admin@example.com', 'Admin', false)
-- ON CONFLICT DO NOTHING;

-- ====================================
-- 说明
-- ====================================
-- 1. 请在 Supabase 中按顺序执行此 SQL 文件
-- 2. 确保已启用必要的扩展（如 uuid-ossp）
-- 3. 根据实际需求调整 RLS 策略
-- 4. 定期备份数据库
-- 5. 监控数据库性能并根据需要添加索引