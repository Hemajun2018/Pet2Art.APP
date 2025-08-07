# Google 登录接入指南

## 步骤 1: 创建 Google OAuth 2.0 凭据

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 在左侧菜单选择 "API和服务" > "凭据"
4. 点击 "创建凭据" > "OAuth 客户端 ID"
5. 如果提示需要配置同意屏幕，先配置 OAuth 同意屏幕：
   - 选择 "外部" 用户类型
   - 填写应用名称、用户支持邮箱等必填信息
   - 添加测试用户（如果在开发阶段）
6. 创建 OAuth 客户端 ID：
   - 应用类型选择 "Web 应用"
   - 名称：填写你的应用名称（如：PetArt Studio）
   - 授权的 JavaScript 来源：
     - 开发环境：`http://localhost:3000`
     - 生产环境：`https://你的域名.com`
   - 授权的重定向 URI：
     - 开发环境：`http://localhost:3000/api/auth/callback/google`
     - 生产环境：`https://你的域名.com/api/auth/callback/google`
7. 点击创建后，会显示你的客户端 ID 和客户端密钥

## 步骤 2: 配置环境变量

在 `.env.local` 文件中更新以下配置：

```env
# Google Auth - 将下面的值替换为你从 Google Cloud Console 获取的实际值
AUTH_GOOGLE_ID = "你的客户端ID.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET = "你的客户端密钥"
NEXT_PUBLIC_AUTH_GOOGLE_ID = "你的客户端ID.apps.googleusercontent.com"
NEXT_PUBLIC_AUTH_GOOGLE_ENABLED = "true"
NEXT_PUBLIC_AUTH_GOOGLE_ONE_TAP_ENABLED = "true"  # 可选：启用 Google One Tap 登录
```

## 步骤 3: 验证配置

1. 重启开发服务器：
   ```bash
   npm run dev
   ```

2. 访问登录页面：`http://localhost:3000/auth/signin`

3. 你应该能看到 "Continue with Google" 按钮

## 功能说明

### 标准 Google OAuth 登录
- 用户点击 "Continue with Google" 按钮
- 跳转到 Google 登录页面
- 登录成功后返回应用

### Google One Tap 登录（可选）
- 在页面上显示 Google One Tap 提示
- 用户可以快速一键登录
- 需要设置 `NEXT_PUBLIC_AUTH_GOOGLE_ONE_TAP_ENABLED = "true"`

## 注意事项

1. **开发环境**：确保使用 `http://localhost:3000` 而不是 `127.0.0.1`
2. **生产环境**：部署前记得更新重定向 URI 为实际域名
3. **安全性**：永远不要将 `AUTH_GOOGLE_SECRET` 提交到版本控制系统
4. **用户数据**：首次登录时会自动创建用户记录，存储在数据库中

## 故障排查

### 常见问题

1. **"redirect_uri_mismatch" 错误**
   - 检查 Google Console 中配置的重定向 URI 是否与实际使用的完全匹配
   - 注意端口号、协议（http/https）和路径

2. **登录按钮不显示**
   - 确认 `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED` 设置为 `"true"`
   - 检查环境变量是否正确加载

3. **登录后无法保存用户信息**
   - 检查数据库连接配置
   - 确认 Supabase 配置正确

## 测试检查清单

- [ ] Google Cloud Console 项目已创建
- [ ] OAuth 2.0 凭据已创建
- [ ] 重定向 URI 已正确配置
- [ ] 环境变量已更新
- [ ] 开发服务器已重启
- [ ] 登录按钮显示正常
- [ ] 可以成功登录
- [ ] 用户信息正确保存到数据库