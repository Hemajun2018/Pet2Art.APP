interface ApiResponse {
  data: Array<{
    url: string
    revised_prompt: string
  }>
  created: number
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
    input_tokens: number
    output_tokens: number
  }
}

const API_KEY = process.env.NEXT_PUBLIC_PET_AI_API_KEY || 'sk-5Um5ukgkeWI6dxB8Z3JUq6MYbpz1biNQMJ4j44uCSBe5gMTk'
const API_URL = 'https://api.apicore.ai/v1/images/edits'

export async function generatePetArt(
  petImageFile: File,
  templateImageUrl: string,
  customPrompt?: string,
  aspectRatio?: string
): Promise<string> {
  const formData = new FormData()
  
  // 获取模板图片并添加为第一张图片（图一）
  const templateResponse = await fetch(templateImageUrl)
  const templateBlob = await templateResponse.blob()
  const templateFile = new File([templateBlob], 'template.jpg', { type: 'image/jpeg' })
  formData.append('image', templateFile)
  
  // 添加用户宠物照片为第二张图片（图二）
  formData.append('image', petImageFile)
  
  // 设置提示词：把图一中的宠物替换成图二中的宠物想象，服装和背景保持不变
  const basePrompt = '把图一中的宠物替换成图二中的宠物想象，服装和背景保持不变'
  const prompt = customPrompt ? `${basePrompt}。${customPrompt}` : basePrompt
  
  // 调试信息
  console.log("API接收到的customPrompt:", customPrompt)
  console.log("最终发送给AI的prompt:", prompt)
  
  formData.append('prompt', prompt)
  
  // 其他参数
  formData.append('n', '1')
  formData.append('response_format', 'url')
  formData.append('model', 'gpt-4o-image')
  formData.append('user', '')
  
  // 添加尺寸参数（如果指定了比例）
  if (aspectRatio && aspectRatio !== 'Auto') {
    const sizeMap = {
      '1:1': '1024x1024',
      '4:3': '1024x768', 
      '3:4': '768x1024',
      '16:9': '1024x576',
      '9:16': '576x1024'
    }
    const size = sizeMap[aspectRatio as keyof typeof sizeMap]
    if (size) {
      formData.append('size', size)
      console.log("设置图片尺寸:", size)
    }
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      },
      body: formData
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API请求失败: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data: ApiResponse = await response.json()
    
    if (data.data && data.data.length > 0) {
      return data.data[0].url
    } else {
      throw new Error('API返回数据格式错误')
    }
  } catch (error) {
    console.error('生成宠物艺术照失败:', error)
    throw error
  }
}

export async function downloadImage(imageUrl: string, filename: string): Promise<void> {
  try {
    const response = await fetch(imageUrl)
    const blob = await response.blob()
    
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
  } catch (error) {
    console.error('下载图片失败:', error)
    throw error
  }
}