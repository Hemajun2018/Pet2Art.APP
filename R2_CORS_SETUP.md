# Cloudflare R2 CORS 配置指南

## 步骤 1：登录 Cloudflare Dashboard

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 登录你的账户

## 步骤 2：进入 R2 存储桶设置

1. 在左侧菜单中，点击 **"R2 Object Storage"**
2. 找到你的存储桶 **"pet2art"**
3. 点击存储桶名称进入管理页面

## 步骤 3：配置 CORS 规则

1. 在存储桶页面，点击 **"Settings"（设置）** 标签
2. 找到 **"CORS Policy"** 部分
3. 点击 **"Add CORS policy"** 或 **"Edit CORS policy"**

## 步骤 4：添加 CORS 配置

在 CORS 配置编辑器中，输入以下 JSON 配置：

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://pet2art.app",
      "https://www.pet2art.app"
    ],
    "AllowedMethods": [
      "GET",
      "HEAD",
      "PUT",
      "POST",
      "DELETE"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Length",
      "Content-Type"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

## 配置说明

### AllowedOrigins（允许的源）
- `http://localhost:3000` - 本地开发环境
- `http://localhost:3001` - 备用本地端口
- `https://pet2art.app` - 生产环境主域名
- `https://www.pet2art.app` - 生产环境 www 子域名

### AllowedMethods（允许的 HTTP 方法）
- `GET` - 读取文件（显示图片）
- `HEAD` - 获取文件元信息
- `PUT` - 上传文件
- `POST` - 上传文件（某些场景）
- `DELETE` - 删除文件（如需要）

### AllowedHeaders（允许的请求头）
- `*` - 允许所有请求头

### ExposeHeaders（暴露的响应头）
- `ETag` - 文件版本标识
- `Content-Length` - 文件大小
- `Content-Type` - 文件类型

### MaxAgeSeconds（预检请求缓存时间）
- `3600` - 浏览器缓存 CORS 预检请求 1 小时

## 步骤 5：保存配置

1. 点击 **"Save"** 或 **"Apply"** 按钮
2. 等待配置生效（通常立即生效）

## 步骤 6：验证配置

### 方法 1：使用 curl 测试

```bash
# 测试 CORS 头
curl -I -X OPTIONS \
  -H "Origin: https://pet2art.app" \
  -H "Access-Control-Request-Method: GET" \
  https://f2bc5423c36aeb4c0aaedbfd2e93b01e.r2.cloudflarestorage.com/pet2art/test-file.jpg
```

### 方法 2：浏览器开发者工具

1. 打开你的网站 `https://pet2art.app`
2. 打开浏览器开发者工具（F12）
3. 进入 Network 标签
4. 生成一个宠物艺术图片
5. 查看图片请求，确认没有 CORS 错误

## 常见问题

### 1. 图片无法显示，控制台显示 CORS 错误

**解决方案**：
- 确认域名已正确添加到 AllowedOrigins
- 检查是否使用了 https（生产环境）或 http（开发环境）
- 清除浏览器缓存后重试

### 2. 上传失败

**解决方案**：
- 确认 PUT 和 POST 方法已添加到 AllowedMethods
- 检查 API 密钥权限是否包含写入权限

### 3. 配置不生效

**解决方案**：
- 等待 1-2 分钟让配置完全生效
- 清除 CDN 缓存（如果使用了 CDN）
- 检查 JSON 格式是否正确

## 额外优化（可选）

### 配置自定义域名（推荐）

如果你想使用自定义域名访问 R2 存储的图片（如 `cdn.pet2art.app`）：

1. 在 R2 存储桶设置中，找到 **"Custom Domains"**
2. 添加 `cdn.pet2art.app`
3. Cloudflare 会自动配置 DNS 和 SSL
4. 更新 `.env.production` 中的 `STORAGE_DOMAIN`：
   ```
   STORAGE_DOMAIN = "https://cdn.pet2art.app"
   ```

### 优势：
- 更好的品牌形象
- 自动 SSL 证书
- Cloudflare CDN 加速
- 隐藏 R2 存储桶的实际地址

## 安全建议

1. **限制来源**：只添加你实际使用的域名
2. **定期审查**：定期检查 CORS 配置，移除不再使用的域名
3. **监控访问**：使用 Cloudflare Analytics 监控 R2 访问情况
4. **设置速率限制**：在 Cloudflare 中配置速率限制规则

## 测试清单

- [ ] 本地开发环境可以正常显示图片
- [ ] 生产环境可以正常显示图片
- [ ] 图片上传功能正常
- [ ] 没有 CORS 相关的控制台错误
- [ ] 图片加载速度正常

完成这些步骤后，你的 R2 存储桶就能正确处理来自 pet2art.app 的请求了！