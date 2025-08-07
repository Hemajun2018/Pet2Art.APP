// 简化的模板类型定义
export interface PetTemplate {
  name: string
  image: string
  category: string
  tag?: "HOT" | "NEW"
}

export interface TemplateCategory {
  id: string
  name: string
  folderName: string
}

// 生成预览图路径
export const getPreviewImagePath = (templateImagePath: string): string => {
  // 分离路径和文件名
  const lastSlashIndex = templateImagePath.lastIndexOf('/')
  const path = templateImagePath.substring(0, lastSlashIndex + 1)
  const filename = templateImagePath.substring(lastSlashIndex + 1)
  
  // 分离文件名和扩展名
  const lastDotIndex = filename.lastIndexOf('.')
  const nameWithoutExt = filename.substring(0, lastDotIndex)
  const extension = filename.substring(lastDotIndex)
  
  // 构建预览图路径
  const previewPath = path.replace('/templates/', '/previews/')
  return `${previewPath}${nameWithoutExt}-p${extension}`
}