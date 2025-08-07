-- 宠物艺术作品表
CREATE TABLE IF NOT EXISTS artworks (
    id SERIAL PRIMARY KEY,
    artwork_id VARCHAR(255) UNIQUE NOT NULL,
    user_uuid VARCHAR(255) NOT NULL,
    created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
    template_id VARCHAR(255) NOT NULL,
    template_name VARCHAR(255),
    generated_image_url TEXT NOT NULL,
    original_image_url TEXT,
    prompt TEXT,
    custom_requirements TEXT,
    aspect_ratio VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'completed',
    credits_used INT NOT NULL DEFAULT 1,
    generation_time INT, -- 生成耗时（毫秒）
    is_public BOOLEAN DEFAULT false, -- 是否公开展示
    likes INT DEFAULT 0,
    views INT DEFAULT 0
);

-- 添加索引
CREATE INDEX idx_artworks_user_uuid ON artworks(user_uuid);
CREATE INDEX idx_artworks_created_at ON artworks(created_at DESC);
CREATE INDEX idx_artworks_is_public ON artworks(is_public);
CREATE INDEX idx_artworks_template_id ON artworks(template_id);

-- 用户收藏表
CREATE TABLE IF NOT EXISTS artwork_favorites (
    id SERIAL PRIMARY KEY,
    user_uuid VARCHAR(255) NOT NULL,
    artwork_id VARCHAR(255) NOT NULL,
    created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_uuid, artwork_id)
);

-- 添加索引
CREATE INDEX idx_favorites_user_uuid ON artwork_favorites(user_uuid);
CREATE INDEX idx_favorites_artwork_id ON artwork_favorites(artwork_id);