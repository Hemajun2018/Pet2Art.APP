import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function GET() {
  try {
    const templatesDir = path.join(process.cwd(), 'public', 'templates')
    
    // 读取所有分类文件夹
    const categories = await fs.readdir(templatesDir)
    
    const templateData: any = {
      categories: [],
      templates: {}
    }
    
    // 过滤系统文件，只保留文件夹
    for (const category of categories) {
      if (category.startsWith('.')) continue // 跳过 .DS_Store 等隐藏文件
      
      const categoryPath = path.join(templatesDir, category)
      const stat = await fs.stat(categoryPath)
      
      if (stat.isDirectory()) {
        // 格式化分类名称（将文件夹名转换为显示名称）
        const displayName = category
          .split(/[-_]/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
        
        templateData.categories.push({
          id: category,
          name: displayName,
          folderName: category
        })
        
        // 读取该分类下的所有图片
        const files = await fs.readdir(categoryPath)
        const images = files.filter(file => {
          const ext = path.extname(file).toLowerCase()
          return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) && !file.startsWith('.')
        })
        
        templateData.templates[category] = images.map(image => {
          // 从文件名生成显示名称
          const nameWithoutExt = path.basename(image, path.extname(image))
          const displayName = nameWithoutExt
            .replace(/-p$/i, '') // 移除预览后缀
            .replace(/[_-]/g, ' ') // 替换下划线和横线为空格
            .replace(/\d+$/, '') // 移除末尾的数字
            .trim()
          
          return {
            name: displayName || nameWithoutExt,
            image: `/templates/${category}/${image}`,
            category: category,
            // 根据文件名判断标签
            tag: image.toLowerCase().includes('hot') ? 'HOT' : 
                 image.toLowerCase().includes('new') ? 'NEW' : undefined
          }
        })
      }
    }
    
    // 添加"全部"分类
    templateData.categories.unshift({
      id: 'all',
      name: 'All',
      folderName: 'all'
    })
    
    return NextResponse.json(templateData)
  } catch (error) {
    console.error('Error reading templates:', error)
    return NextResponse.json(
      { error: 'Failed to load templates' },
      { status: 500 }
    )
  }
}