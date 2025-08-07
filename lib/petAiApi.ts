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
  
  // Get template image and add it as the first image
  const templateResponse = await fetch(templateImageUrl)
  const templateBlob = await templateResponse.blob()
  const templateFile = new File([templateBlob], 'template.jpg', { type: 'image/jpeg' })
  formData.append('image', templateFile)
  
  // Add user's pet photo as the second image
  formData.append('image', petImageFile)
  
  // Set prompt: Replace the pet in image 1 with the pet from image 2, keeping the clothing and background unchanged
  const basePrompt = 'Replace the pet in the first image with the pet from the second image, keeping the clothing, style, and background unchanged'
  const prompt = customPrompt ? `${basePrompt}. ${customPrompt}` : basePrompt
  
  // Debug info
  console.log("Custom prompt received:", customPrompt)
  console.log("Final prompt sent to AI:", prompt)
  
  formData.append('prompt', prompt)
  
  // Other parameters
  formData.append('n', '1')
  formData.append('response_format', 'url')
  formData.append('model', 'gpt-4o-image')
  formData.append('user', '')
  
  // Add size parameter (if aspect ratio is specified)
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
      console.log("Setting image size:", size)
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
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data: ApiResponse = await response.json()
    
    if (data.data && data.data.length > 0) {
      return data.data[0].url
    } else {
      throw new Error('API returned invalid data format')
    }
  } catch (error) {
    console.error('Failed to generate pet art:', error)
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
    console.error('Failed to download image:', error)
    throw error
  }
}