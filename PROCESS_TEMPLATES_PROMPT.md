# 模板处理提示词

## 完整版提示词

```
你现在在我的宠物艺术照生成项目中，请帮我处理 public/Pending templates 文件夹中的所有模板图片：

1. 分析每张图片的风格和内容，自动分类到 public/templates 中合适的文件夹（如果没有合适的分类则创建新分类），并按"风格意象 — 宠物品种"格式命名，如 Spring Blooms — Gentleman Labrador

2. 所有模板处理完毕后，运行 scripts/generate-previews.ts 脚本，检测各分类中缺失预览图的模板，自动生成预览图保存到 public/previews 对应文件夹，命名去掉品种部分，如 Spring Blooms
```

## 简化版提示词

```
处理 Pending templates 文件夹中的所有模板图片
```

## 带参数的提示词

### 指定默认分类
```
处理 Pending templates 文件夹中的模板，默认分类为 Fashion model
```

### 只分析不生成预览
```
处理 Pending templates 文件夹中的模板，跳过预览图生成
```

### 只分析不移动文件（预览模式）
```
分析 Pending templates 文件夹中的模板，只显示分类建议不移动文件
```

## 工作流程说明

### 第一步：准备模板图片
1. 将待处理的模板图片放入 `public/Pending templates/` 文件夹
2. 支持格式：jpg, jpeg, png, gif, webp

### 第二步：使用提示词
1. 在 Claude Code 对话框中输入上述提示词
2. Claude 会自动：
   - 读取并分析每张图片
   - 识别艺术风格（工笔画/维多利亚肖像/时尚摄影等）
   - 识别宠物品种
   - 生成诗意的风格命名
   - 移动并重命名文件到对应分类

### 第三步：生成预览图
Claude 处理完模板后会自动运行 `npm run generate-previews`，生成所有缺失的预览图

## 分类规则

### 现有分类
- `Gongbi painting` - 工笔画风格
- `Victorian portraits` - 维多利亚肖像风格
- `Fashion model` - 时尚摄影风格
- `Fantasy Art` - 幻想艺术风格
- `Cute` - 可爱卡通风格
- `World Famous Paintings` - 世界名画风格

### 命名规则
- **格式**：`[风格意象] — [宠物品种].扩展名`
- **风格意象示例**：
  - 花卉类：Spring Blooms, Rose Garden, Peony Delight
  - 季节类：Winter Wonder, Autumn Muse, Summer Breeze
  - 材质类：Porcelain, Velvet, Silk
  - 情绪类：Serene Beauty, Playful Spirit, Noble Grace
  - 服装类：Leather Jacket, Chic Beret, Winter Puffer

### 预览图命名
- 自动去掉 " — 宠物品种" 部分
- 示例：`Spring Blooms — Gentleman Labrador.jpg` → `Spring Blooms.jpg`

## 手动命令

### 检查缺失的预览图
```bash
npm run generate-previews:dry
```

### 生成所有缺失的预览图
```bash
npm run generate-previews
```

## 注意事项

1. **文件会被移动**：Pending templates 中的文件处理后会被移动到 templates 文件夹
2. **自动创建分类**：如果没有合适的现有分类，会自动创建新的分类文件夹
3. **预览图生成**：使用 reference.png 作为默认宠物图与模板合成
4. **API 限制**：预览图生成有速率限制，脚本会自动控制并发和延迟

## 故障排除

### 预览图生成失败
- 检查 API Key 是否有效
- 检查网络连接
- 查看控制台错误信息
- 可以单独运行 `npm run generate-previews` 重试

### 分类错误
- 可以手动移动文件到正确分类
- 重新运行预览图生成脚本

### 命名不满意
- 可以手动修改文件名
- 保持 " — " 格式以确保预览图命名正确