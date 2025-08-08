# Pending Templates Folder

This folder is for storing template images that are waiting to be processed.

## Usage

1. Place your template images here
2. In Claude Code, use the following prompt:

```
你现在在我的宠物艺术照生成项目中，请帮我处理 public/Pending templates 文件夹中的所有模板图片：

1. 分析每张图片的风格和内容，自动分类到 public/templates 中合适的文件夹（如果没有合适的分类则创建新分类），并按"风格意象 — 宠物品种"格式命名，如 Spring Blooms — Gentleman Labrador

2. 所有模板处理完毕后，运行 scripts/generate-previews.ts 脚本，检测各分类中缺失预览图的模板，自动生成预览图保存到 public/previews 对应文件夹，命名去掉品种部分，如 Spring Blooms
```

3. Claude Code will:
   - Analyze each image
   - Categorize and rename them
   - Move them to the appropriate template folder
   - Generate preview images automatically

## Notes

- Supported formats: jpg, jpeg, png, gif, webp
- Images will be automatically moved after processing
- Preview generation uses the reference.png file