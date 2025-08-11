# Cloudflare R2 配置指南

## 1. 创建 R2 存储桶

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 "R2 Object Storage"
3. 创建新的存储桶（例如：`pet-art-storage`）
4. 在存储桶设置中，配置自定义域名（可选）

## 2. 获取 API 凭证

1. 在 Cloudflare Dashboard 中，进入 "R2" → "Manage API tokens"
2. 创建新的 API Token
3. 权限选择 "Object Read & Write"
4. 选择你创建的存储桶
5. 创建后保存以下信息：
   - Access Key ID
   - Secret Access Key
   - Account ID

## 3. 配置环境变量

在 `.env.local` 文件中添加以下配置：

```env
# Cloudflare R2 配置
STORAGE_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
STORAGE_REGION=auto
STORAGE_ACCESS_KEY=<your-access-key-id>
STORAGE_SECRET_KEY=<your-secret-access-key>
STORAGE_BUCKET=<your-bucket-name>
STORAGE_DOMAIN=<your-custom-domain> # 可选，如果配置了自定义域名
```

替换说明：
- `<account-id>`: 你的 Cloudflare 账户 ID
- `<your-access-key-id>`: R2 API Token 的 Access Key ID
- `<your-secret-access-key>`: R2 API Token 的 Secret Access Key
- `<your-bucket-name>`: 你创建的存储桶名称（例如：pet-art-storage）
- `<your-custom-domain>`: 自定义域名（可选，例如：https://cdn.yourdomain.com）

## 4. 配置 CORS（如需直接从浏览器访问）

在 R2 存储桶设置中配置 CORS 规则：

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

## 5. 测试配置

重启开发服务器并测试图片生成功能：

```bash
npm run dev
```

现在，当用户生成宠物艺术图片时：
1. 图片会先从 AI API 生成
2. 自动下载并上传到你的 R2 存储桶
3. 用户的原始宠物图片也会上传保存
4. 数据库中存储 R2 的 URL

## 注意事项

- 确保 R2 存储桶有足够的存储空间
- 配置合理的生命周期策略来管理旧图片
- 考虑设置 CDN 缓存来优化图片加载速度
- 定期备份重要数据