# 🎨 模板管理使用说明

## 📁 简化后的管理方式

现在添加模板**超级简单**，只需要：

1. **创建分类文件夹**（如果是新分类）
2. **把模板图片放进去**
3. **完成！**

系统会自动：
- ✅ 识别所有文件夹作为分类
- ✅ 加载文件夹内的所有图片作为模板
- ✅ 自动生成分类名称和模板名称
- ✅ 无需修改任何代码

## 🗂️ 文件夹结构

```
public/
├── templates/          # 模板文件夹
│   ├── photography/    # 摄影风格
│   ├── gongbi/        # 工笔画风格
│   ├── cartoon/       # 卡通风格
│   ├── cute/          # 可爱风格
│   └── [新分类]/      # 你可以随时添加新分类
│
└── previews/          # 预览图文件夹（可选）
    └── [对应分类]/
        └── [图片名]-p.[扩展名]
```

## 📝 使用步骤

### 1. 添加新分类
```bash
# 在 templates 文件夹下创建新文件夹
mkdir public/templates/你的新分类

# 如果需要预览图
mkdir public/previews/你的新分类
```

### 2. 添加模板图片
直接将图片文件拖放到对应分类文件夹中即可

### 3. 命名建议
- **分类文件夹**：使用英文，如 `fantasy`, `realistic`, `anime`
- **图片文件**：任意命名都可以，系统会自动处理
- **预览图**：原图名 + `-p` 后缀

## 🎯 示例

假设要添加一个"梦幻风格"分类：

1. 创建文件夹：
   ```
   public/templates/fantasy/
   ```

2. 放入图片：
   ```
   public/templates/fantasy/
   ├── dream-cat.jpg
   ├── magic-dog.png
   └── fairy-pet.jpg
   ```

3. （可选）添加预览图：
   ```
   public/previews/fantasy/
   ├── dream-cat-p.jpg
   ├── magic-dog-p.png
   └── fairy-pet-p.jpg
   ```

**完成！** 刷新页面就能看到新分类和模板了。

## 🔥 特殊标签

如果想给某些模板加上 HOT 或 NEW 标签，在文件名中包含相应关键词即可：
- 包含 `hot` → 显示 HOT 标签
- 包含 `new` → 显示 NEW 标签

例如：`cute-cat-hot.jpg` 会自动显示 HOT 标签

## ⚡ 优势

- ✅ **零代码**：完全不需要修改代码
- ✅ **即时生效**：添加图片后刷新页面即可
- ✅ **灵活管理**：随时添加/删除/重命名
- ✅ **批量操作**：可以一次性添加多张图片
- ✅ **自动识别**：支持 jpg, jpeg, png, webp 格式

## 🚀 批量添加模板

如果有大量模板需要添加：

```bash
# 批量复制图片到指定分类
cp /你的图片源文件夹/*.jpg public/templates/photography/

# 批量重命名（如需要）
for file in public/templates/photography/*.jpg; do
    mv "$file" "${file%.jpg}-new.jpg"
done
```

---

现在你可以专注于收集优质的模板图片，系统会自动处理其他所有事情！🎉