-- ====================================
-- 删除所有表格的脚本
-- 警告：这将删除所有数据！请先备份！
-- ====================================

-- 先删除依赖其他表的视图
DROP VIEW IF EXISTS user_credits_summary CASCADE;
DROP VIEW IF EXISTS trending_artworks CASCADE;

-- 删除有外键依赖的表（按依赖顺序）
DROP TABLE IF EXISTS artwork_favorites CASCADE;
DROP TABLE IF EXISTS artworks CASCADE;
DROP TABLE IF EXISTS feedbacks CASCADE;
DROP TABLE IF EXISTS affiliates CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS apikeys CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS credits CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 删除所有函数
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS increment_artwork_views(VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS increment_artwork_likes(VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS decrement_artwork_likes(VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS get_user_credits(VARCHAR) CASCADE;

-- ====================================
-- 执行完成后，数据库将是空的
-- 可以重新执行 init.sql 和 update-schema.sql
-- ====================================