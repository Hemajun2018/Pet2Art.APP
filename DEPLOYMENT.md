# Pet2Art 部署指南

## 域名信息
- **主域名**: pet2art.app
- **网站 URL**: https://pet2art.app

## 部署选项

### 1. Vercel 部署（推荐）

#### 步骤：

1. **连接 GitHub 仓库**
   ```bash
   git init
   git add .
   git commit -m "Initial commit for Pet2Art"
   git remote add origin <你的GitHub仓库URL>
   git push -u origin main
   ```

2. **在 Vercel 中导入项目**
   - 访问 [vercel.com](https://vercel.com)
   - 点击 "New Project"
   - 导入你的 GitHub 仓库
   - 选择 Next.js 框架

3. **配置环境变量**
   在 Vercel 项目设置中，添加所有 `.env.production` 文件中的环境变量

4. **配置域名**
   - 在 Vercel 项目设置的 Domains 部分
   - 添加 `pet2art.app` 和 `www.pet2art.app`
   - 在你的域名注册商处配置 DNS：
     ```
     A记录: @ -> 76.76.21.21
     CNAME记录: www -> cname.vercel-dns.com
     ```

5. **部署**
   ```bash
   git push origin main
   ```
   Vercel 会自动部署

### 2. Cloudflare Pages 部署

#### 步骤：

1. **构建项目**
   ```bash
   pnpm cf:build
   ```

2. **创建 Cloudflare Pages 项目**
   - 登录 Cloudflare Dashboard
   - 进入 Pages
   - 创建新项目
   - 连接 GitHub 仓库

3. **配置构建设置**
   - 构建命令: `pnpm cf:build`
   - 构建输出目录: `.vercel/output/static`
   - Node 版本: 18 或更高

4. **配置环境变量**
   在 Cloudflare Pages 设置中添加所有环境变量

5. **配置自定义域名**
   - 在 Pages 项目设置中添加 `pet2art.app`
   - Cloudflare 会自动配置 DNS

### 3. 自托管部署（VPS）

#### 使用 Docker：

1. **构建 Docker 镜像**
   ```bash
   pnpm docker:build
   ```

2. **运行容器**
   ```bash
   docker run -d \
     --name pet2art \
     -p 3000:3000 \
     --env-file .env.production \
     pet2art:latest
   ```

#### 使用 PM2：

1. **安装依赖**
   ```bash
   pnpm install
   pnpm build
   ```

2. **使用 PM2 启动**
   ```bash
   npm install -g pm2
   pm2 start ecosystem.config.js
   ```

3. **配置 Nginx 反向代理**
   ```nginx
   server {
     listen 80;
     server_name pet2art.app www.pet2art.app;
     
     location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

4. **配置 SSL（使用 Certbot）**
   ```bash
   sudo certbot --nginx -d pet2art.app -d www.pet2art.app
   ```

## 重要配置更新

### 1. Google OAuth 回调 URL
在 Google Cloud Console 中更新授权重定向 URI：
- `https://pet2art.app/api/auth/callback/google`
- `https://www.pet2art.app/api/auth/callback/google`

### 2. Cloudflare R2 CORS 配置
在 R2 存储桶设置中，添加域名到允许的源：
```json
[
  {
    "AllowedOrigins": ["https://pet2art.app", "https://www.pet2art.app"],
    "AllowedMethods": ["GET", "HEAD", "PUT", "POST"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

### 3. 生产环境 AUTH_SECRET
生成新的密钥：
```bash
openssl rand -base64 32
```
将生成的密钥更新到 `.env.production` 中的 `AUTH_SECRET`

## 监控和维护

### 1. 设置监控
- **Vercel Analytics**: 自动集成
- **Google Analytics**: 配置 `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID`
- **Sentry**: 添加错误追踪（可选）

### 2. 备份策略
- **数据库**: Supabase 自动备份
- **图片**: R2 存储桶配置生命周期策略
- **代码**: GitHub 仓库

### 3. 性能优化
- 启用 CDN 缓存
- 配置图片优化
- 使用 Edge Functions（如果使用 Vercel）

## 部署检查清单

- [ ] 更新 `.env.production` 中的所有敏感信息
- [ ] 生成新的 `AUTH_SECRET`
- [ ] 配置域名 DNS
- [ ] 更新 Google OAuth 回调 URL
- [ ] 配置 R2 CORS
- [ ] 测试支付功能
- [ ] 测试图片生成和存储
- [ ] 配置 SSL 证书
- [ ] 设置监控和告警
- [ ] 测试所有认证方式

## 故障排除

### 常见问题：

1. **图片无法显示**
   - 检查 R2 CORS 配置
   - 验证 STORAGE_DOMAIN 设置

2. **Google 登录失败**
   - 检查回调 URL 配置
   - 验证 CLIENT_ID 和 SECRET

3. **数据库连接错误**
   - 检查 Supabase 凭证
   - 验证网络连接

4. **构建失败**
   - 检查 Node.js 版本（需要 18+）
   - 清理缓存：`rm -rf .next node_modules`

## 联系支持

如有问题，请查看：
- 项目文档
- GitHub Issues
- Vercel/Cloudflare 文档