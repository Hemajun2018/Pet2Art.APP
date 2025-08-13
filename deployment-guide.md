# 服务器部署指南

## 快速部署到 VPS

### 1. 选择 VPS 服务商
推荐配置：
- CPU: 1 核
- 内存: 1-2 GB
- 存储: 20-30 GB SSD
- 流量: 1-2 TB/月
- 价格: $5-10/月

推荐服务商：
- **国外**: DigitalOcean, Vultr, Linode
- **国内**: 腾讯云轻量服务器, 阿里云轻量服务器

### 2. 服务器初始化

```bash
# SSH 登录服务器
ssh root@your-server-ip

# 更新系统
apt update && apt upgrade -y

# 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 安装 pnpm
npm install -g pnpm

# 安装 PM2（进程管理）
npm install -g pm2

# 安装 Nginx（反向代理）
apt install -y nginx

# 安装 Git
apt install -y git
```

### 3. 部署应用

```bash
# 克隆代码
cd /var/www
git clone https://github.com/your-repo/shipany_template.git
cd shipany_template

# 安装依赖
pnpm install

# 配置环境变量
cp .env.local.example .env.local
nano .env.local  # 编辑环境变量

# 构建项目
pnpm build

# 使用 PM2 启动
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 4. 配置 Nginx

创建 `/etc/nginx/sites-available/pet2art`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 重要：增加超时时间
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }
}
```

启用配置：
```bash
ln -s /etc/nginx/sites-available/pet2art /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 5. 配置 SSL（HTTPS）

```bash
# 安装 Certbot
apt install -y certbot python3-certbot-nginx

# 获取 SSL 证书
certbot --nginx -d your-domain.com

# 自动续期
certbot renew --dry-run
```

## PM2 配置文件

创建 `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'pet2art',
    script: 'node_modules/.bin/next',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
```

## 自动部署脚本

创建 `deploy.sh`:

```bash
#!/bin/bash
# 自动部署脚本

echo "Starting deployment..."

# 拉取最新代码
git pull origin main

# 安装依赖
pnpm install

# 构建项目
pnpm build

# 重启服务
pm2 restart pet2art

echo "Deployment completed!"
```

## 监控和维护

### 查看日志
```bash
# PM2 日志
pm2 logs pet2art

# Nginx 日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 监控资源
```bash
# 查看 PM2 状态
pm2 status
pm2 monit

# 系统资源
htop
df -h
```

### 备份数据库
```bash
# 如果使用本地数据库
pg_dump database_name > backup.sql

# 恢复
psql database_name < backup.sql
```

## Docker 部署（可选）

### Dockerfile 已存在
项目中已包含 Dockerfile，可以直接使用：

```bash
# 构建镜像
docker build -t pet2art .

# 运行容器
docker run -d \
  --name pet2art \
  -p 3000:3000 \
  --env-file .env.local \
  --restart unless-stopped \
  pet2art
```

### 使用 Docker Compose

创建 `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env.local
    restart: unless-stopped
    networks:
      - pet2art-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - pet2art-network

networks:
  pet2art-network:
    driver: bridge
```

## 性能优化建议

1. **使用 CDN**: 配置 Cloudflare CDN 加速静态资源
2. **图片优化**: 使用对象存储（S3/R2）存储生成的图片
3. **缓存策略**: 配置 Redis 缓存热门数据
4. **负载均衡**: 流量大时可以部署多个实例

## 成本对比

| 方案 | 月费用 | 优点 | 缺点 |
|------|--------|------|------|
| Vercel 免费版 | $0 | 免费，自动部署 | 10秒超时限制 |
| Vercel Pro | $20 | 60秒超时，自动扩容 | 较贵 |
| VPS (1GB) | $5-10 | 完全控制，无限制 | 需要自己维护 |
| Railway/Render | $5-7 | 自动部署，无超时 | 有一定限制 |

## 推荐架构

对于 Pet2Art 这样的 AI 应用，推荐：

1. **主站**: 继续使用 Vercel 免费版部署前端
2. **API 服务器**: VPS 部署 API，处理 AI 生图等长时间任务
3. **存储**: Cloudflare R2 或 AWS S3 存储图片
4. **数据库**: Supabase（已配置）

这样可以：
- 利用 Vercel 的全球 CDN
- 避免超时问题
- 成本控制在 $10/月以内
- 保持良好的性能和可扩展性