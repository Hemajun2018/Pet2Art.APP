# 预览图使用说明

## 文件夹结构
预览图文件夹结构需要与模板文件夹保持一致：
```
public/
├── templates/          # 模板图片
│   ├── photography/
│   ├── gongbi/
│   ├── cartoon/
│   └── cute/
└── previews/          # 预览图片（效果图）
    ├── photography/
    ├── gongbi/
    ├── cartoon/
    └── cute/
```

## 命名规则
预览图的命名规则：在原模板文件名后添加 `-p` 后缀

### 示例：
- **模板图片路径：** `/templates/photography/Corgi Photo.jpg`
- **预览图片路径：** `/previews/photography/Corgi Photo-p.jpg`

- **模板图片路径：** `/templates/gongbi/工笔风比熊合集_1_四只脚宠物摄影_来自小红书网页版.jpg`
- **预览图片路径：** `/previews/gongbi/工笔风比熊合集_1_四只脚宠物摄影_来自小红书网页版-p.jpg`

## 使用步骤
1. 为每个模板准备对应的预览图（生成效果图）
2. 按照上述命名规则重命名预览图
3. 将预览图放置在对应的分类文件夹中
4. 系统会自动在选择模板时显示对应的预览图

## 注意事项
- 预览图格式需要与模板图片格式保持一致（.jpg 或 .png）
- 如果预览图不存在，系统会显示默认提示文字
- 建议预览图尺寸为 800x800 像素左右，以保证加载速度

## 批量处理提示
如果有大量模板需要添加预览图，可以使用批处理脚本：

```bash
# 例如：批量复制并重命名（需要后续替换为真实预览图）
for file in templates/*/*.{jpg,png}; do
  dir=$(dirname "$file")
  filename=$(basename "$file")
  preview_dir=${dir/templates/previews}
  name="${filename%.*}"
  ext="${filename##*.}"
  mkdir -p "$preview_dir"
  # cp "$file" "$preview_dir/${name}-p.$ext"  # 临时复制，后续替换为真实预览图
done
```