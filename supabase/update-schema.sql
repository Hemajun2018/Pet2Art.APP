-- ====================================
-- 增量更新脚本 - 在现有数据库基础上添加新功能
-- ====================================

-- 1. 为 users 表添加缺失的字段（如果不存在）
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS locale VARCHAR(50) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS invite_code VARCHAR(255) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS invited_by VARCHAR(255) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS is_affiliate BOOLEAN NOT NULL DEFAULT false;

-- 修改 email 列，移除 UNIQUE 约束（如果需要支持多个登录方式）
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE users ADD CONSTRAINT users_email_provider_unique UNIQUE (email, signin_provider);

-- 2. 为 credits 表添加缺失的字段
ALTER TABLE credits
ADD COLUMN IF NOT EXISTS description TEXT;

-- 3. 为 orders 表添加缺失的字段
ALTER TABLE orders
ALTER COLUMN user_uuid SET DEFAULT '',
ADD COLUMN IF NOT EXISTS user_email VARCHAR(255) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS interval VARCHAR(50),
ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS sub_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS sub_interval_count INT,
ADD COLUMN IF NOT EXISTS sub_cycle_anchor INT,
ADD COLUMN IF NOT EXISTS sub_period_end INT,
ADD COLUMN IF NOT EXISTS sub_period_start INT,
ADD COLUMN IF NOT EXISTS sub_times INT,
ADD COLUMN IF NOT EXISTS product_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS valid_months INT,
ADD COLUMN IF NOT EXISTS order_detail TEXT,
ADD COLUMN IF NOT EXISTS paid_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS paid_detail TEXT,
ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(50);

-- 修改 amount 列的类型为 INT（如果需要）
-- 注意：这可能需要手动处理现有数据
-- ALTER TABLE orders ALTER COLUMN amount TYPE INT USING (amount * 100)::INT;

-- 4. 为 apikeys 表添加缺失的字段
ALTER TABLE apikeys
ADD COLUMN IF NOT EXISTS title VARCHAR(100),
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP;

-- 重命名 key 列为 api_key（如果列名是 key）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'apikeys' AND column_name = 'key') THEN
        ALTER TABLE apikeys RENAME COLUMN key TO api_key;
    END IF;
END $$;

-- 5. 创建 posts 表（博客/文章）
CREATE TABLE IF NOT EXISTS posts (
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

-- 6. 创建 affiliates 表（推广联盟）
CREATE TABLE IF NOT EXISTS affiliates (
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

-- 7. 创建 feedbacks 表（用户反馈）
CREATE TABLE IF NOT EXISTS feedbacks (
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

-- 8. 创建 artworks 表（AI生成的宠物艺术作品）
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

-- 9. 创建 artwork_favorites 表（作品收藏）
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
-- 创建新的索引
-- ====================================

-- users 表的新索引
CREATE INDEX IF NOT EXISTS idx_users_invite_code ON users(invite_code);
CREATE INDEX IF NOT EXISTS idx_users_invited_by ON users(invited_by);

-- posts 表索引
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_locale ON posts(locale);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- affiliates 表索引
CREATE INDEX IF NOT EXISTS idx_affiliates_user_uuid ON affiliates(user_uuid);
CREATE INDEX IF NOT EXISTS idx_affiliates_invited_by ON affiliates(invited_by);
CREATE INDEX IF NOT EXISTS idx_affiliates_status ON affiliates(status);

-- feedbacks 表索引
CREATE INDEX IF NOT EXISTS idx_feedbacks_user_uuid ON feedbacks(user_uuid);
CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks(status);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON feedbacks(created_at DESC);

-- artworks 表索引
CREATE INDEX IF NOT EXISTS idx_artworks_user_uuid ON artworks(user_uuid);
CREATE INDEX IF NOT EXISTS idx_artworks_created_at ON artworks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_artworks_is_public ON artworks(is_public);
CREATE INDEX IF NOT EXISTS idx_artworks_template_id ON artworks(template_id);
CREATE INDEX IF NOT EXISTS idx_artworks_status ON artworks(status);
CREATE INDEX IF NOT EXISTS idx_artworks_likes ON artworks(likes DESC);
CREATE INDEX IF NOT EXISTS idx_artworks_views ON artworks(views DESC);

-- artwork_favorites 表索引
CREATE INDEX IF NOT EXISTS idx_favorites_user_uuid ON artwork_favorites(user_uuid);
CREATE INDEX IF NOT EXISTS idx_favorites_artwork_id ON artwork_favorites(artwork_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON artwork_favorites(created_at DESC);

-- orders 表的新索引
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_provider ON orders(payment_provider);

-- credits 表的新索引
CREATE INDEX IF NOT EXISTS idx_credits_trans_type ON credits(trans_type);
CREATE INDEX IF NOT EXISTS idx_credits_created_at ON credits(created_at DESC);

-- apikeys 表的新索引
CREATE INDEX IF NOT EXISTS idx_apikeys_status ON apikeys(status);

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

-- 为需要 updated_at 的表创建触发器（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_orders_updated_at') THEN
        CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_posts_updated_at') THEN
        CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

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
-- 更新 RLS 策略
-- ====================================

-- 为新表启用 RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE artwork_favorites ENABLE ROW LEVEL SECURITY;

-- 创建服务角色的策略（允许完全访问）
-- 先删除可能存在的策略，再创建新的
DROP POLICY IF EXISTS "Service role can access all posts" ON posts;
CREATE POLICY "Service role can access all posts" ON posts
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can access all affiliates" ON affiliates;
CREATE POLICY "Service role can access all affiliates" ON affiliates
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can access all feedbacks" ON feedbacks;
CREATE POLICY "Service role can access all feedbacks" ON feedbacks
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can access all artworks" ON artworks;
CREATE POLICY "Service role can access all artworks" ON artworks
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can access all favorites" ON artwork_favorites;
CREATE POLICY "Service role can access all favorites" ON artwork_favorites
    FOR ALL USING (auth.role() = 'service_role');

-- ====================================
-- 说明
-- ====================================
-- 此脚本用于从原有的基础表结构升级到完整版本
-- 执行前请确保已备份数据库
-- 如果某些列已存在，脚本会自动跳过