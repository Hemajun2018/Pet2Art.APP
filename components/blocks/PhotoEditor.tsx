"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Image from "next/image"
import { getPreviewImagePath, type PetTemplate, type TemplateCategory } from "@/lib/petTemplates"
import { downloadImage } from "@/lib/petAiApi"
import { useAppContext } from "@/contexts/app"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { validateImageFile, checkProhibitedContent, sanitizeInput } from "@/lib/contentFilter"
import { toast } from "sonner"

export default function PetArtGenerator() {
  const router = useRouter()
  const { data: session } = useSession()
  const { user, setShowSignModal } = useAppContext()
  
  const [selectedTemplates, setSelectedTemplates] = useState<PetTemplate[]>([])
  const [lastSelectedTemplate, setLastSelectedTemplate] = useState<PetTemplate | null>(null) // 追踪最后选择的模版
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [petImage, setPetImage] = useState<File | null>(null)
  const [petImagePreview, setPetImagePreview] = useState<string>("")
  const [selectedRatio, setSelectedRatio] = useState<string>("Auto")
  const [customPrompt, setCustomPrompt] = useState("")
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationMessage, setGenerationMessage] = useState('')
  const [startTime, setStartTime] = useState<number | null>(null)
  const [showReferenceImage, setShowReferenceImage] = useState(true)
  const [userCredits, setUserCredits] = useState<number>(0)
  const [templateCategories, setTemplateCategories] = useState<TemplateCategory[]>([])
  const [templates, setTemplates] = useState<Record<string, PetTemplate[]>>({})
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true)
  const [showTipDialog, setShowTipDialog] = useState(false)

  // 获取用户积分
  useEffect(() => {
    if (session && user) {
      fetchUserCredits()
    }
  }, [session, user])

  // 加载模板数据
  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/get-templates')
      if (response.ok) {
        const data = await response.json()
        setTemplateCategories(data.categories)
        setTemplates(data.templates)
        
        // 不再默认选择模板
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      setIsLoadingTemplates(false)
    }
  }

  const fetchUserCredits = async () => {
    try {
      const resp = await fetch("/api/get-user-credits", {
        method: "POST",
      })
      
      if (resp.ok) {
        const { data } = await resp.json()
        setUserCredits(data.left_credits || 0)
      }
    } catch (error) {
      console.error("Failed to fetch user credits:", error)
    }
  }

  const ratios = [
    { id: "Auto", label: "Auto", description: "Default 3:4" },
    { id: "1:1", label: "1:1", description: "Square" },
    { id: "3:4", label: "3:4", description: "Portrait" },
    { id: "4:3", label: "4:3", description: "Landscape" },
    
    { id: "16:9", label: "16:9", description: "Widescreen" },
    { id: "9:16", label: "9:16", description: "Mobile" }
  ]

  const processImageFile = (file: File) => {
    // Validate image file
    const validation = validateImageFile(file)
    if (!validation.isValid) {
      alert(validation.reason)
      return
    }
    
    setPetImage(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setPetImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handlePetImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      processImageFile(file)
      // Remove reference image when user uploads their own
      setShowReferenceImage(false)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file) {
      processImageFile(file)
      // Remove reference image when user uploads their own
      setShowReferenceImage(false)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }


  const handleGenerate = async () => {
    if (!petImage || selectedTemplates.length === 0) {
      alert("Please upload a pet photo and select at least one template")
      return
    }
    
    // Reset progress state
    setGenerationProgress(0)
    setGenerationMessage('Preparing to generate...')
    setStartTime(Date.now())
    
    // Simulate progress updates - 更合理的进度模拟
    // 预期3分钟完成，前2.5分钟到达85%，最后0.5分钟停留在85-90%
    const expectedDuration = 180000 // 3分钟 = 180秒
    const updateInterval = 2000 // 每2秒更新一次
    const updates = 150000 / updateInterval // 前2.5分钟的更新次数
    const progressPerUpdate = 85 / updates // 每次更新的进度
    
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        // 根据已经过去的时间计算应该达到的进度
        const elapsedTime = Date.now() - startTime
        
        if (elapsedTime < 60000) {
          // 第一分钟：缓慢增长到30%
          const targetProgress = (elapsedTime / 60000) * 30
          return Math.min(targetProgress, 30)
        } else if (elapsedTime < 120000) {
          // 第二分钟：从30%增长到60%
          const minuteProgress = ((elapsedTime - 60000) / 60000) * 30
          return Math.min(30 + minuteProgress, 60)
        } else if (elapsedTime < 150000) {
          // 第2.5分钟：从60%增长到85%
          const halfMinuteProgress = ((elapsedTime - 120000) / 30000) * 25
          return Math.min(60 + halfMinuteProgress, 85)
        } else if (elapsedTime < 180000) {
          // 2.5-3分钟：从85%增长到90%
          const lastHalfMinuteProgress = ((elapsedTime - 150000) / 30000) * 5
          return Math.min(85 + lastHalfMinuteProgress, 90)
        } else if (elapsedTime < 240000) {
          // 3-4分钟：从90%缓慢增长到94%
          const extraMinuteProgress = ((elapsedTime - 180000) / 60000) * 4
          return Math.min(90 + extraMinuteProgress, 94)
        } else if (elapsedTime < 300000) {
          // 4-5分钟：从94%缓慢增长到97%
          const extraProgress = ((elapsedTime - 240000) / 60000) * 3
          return Math.min(94 + extraProgress, 97)
        } else {
          // 5分钟后：停留在97-99%之间，偶尔微小增长
          if (prev >= 99) return 99
          // 每次有20%的概率增加0.1%
          if (Math.random() < 0.2) {
            return Math.min(prev + 0.1, 99)
          }
          return prev
        }
      })
    }, updateInterval)
    
    // Update status messages - 根据进度更新消息
    const messageInterval = setInterval(() => {
      const elapsedTime = Date.now() - startTime
      
      if (elapsedTime < 20000) {
        setGenerationMessage('Analyzing your pet photo...')
      } else if (elapsedTime < 40000) {
        setGenerationMessage('Identifying pet features...')
      } else if (elapsedTime < 70000) {
        setGenerationMessage('Applying artistic style...')
      } else if (elapsedTime < 100000) {
        setGenerationMessage('Enhancing details...')
      } else if (elapsedTime < 140000) {
        setGenerationMessage('AI is creating your masterpiece...')
      } else if (elapsedTime < 180000) {
        setGenerationMessage('Almost done, please wait...')
      } else if (elapsedTime < 240000) {
        setGenerationMessage('Finalizing your artwork, thank you for your patience...')
      } else if (elapsedTime < 300000) {
        setGenerationMessage('Taking a bit longer, but it will be worth it...')
      } else {
        setGenerationMessage('Processing complex details, please hold on...')
      }
    }, 5000)

    // 检查用户是否登录
    if (!session || !user) {
      setShowSignModal(true)
      return
    }

    // 检查用户积分
    const requiredCredits = selectedTemplates.length
    if (userCredits < requiredCredits) {
      alert(`Insufficient credits. You need ${requiredCredits} credits but only have ${userCredits}. Please purchase more credits.`)
      router.push("/pricing")
      return
    }

    // Check custom prompt for prohibited content
    if (customPrompt) {
      const sanitizedPrompt = sanitizeInput(customPrompt)
      const contentCheck = checkProhibitedContent(sanitizedPrompt)
      if (!contentCheck.isValid) {
        alert(contentCheck.reason)
        return
      }
    }

    // Show notification about generation time and email
    toast.info(
      <div>
        <p className="font-semibold">Generation Started!</p>
        <p className="text-sm mt-1">Generating {selectedTemplates.length} image{selectedTemplates.length > 1 ? 's' : ''}. This takes 2-3 minutes per image.</p>
        <p className="text-sm mt-1">Your artworks will be sent to your registered email when complete.</p>
      </div>,
      {
        duration: 8000,
        position: "top-center",
      }
    )

    setIsGenerating(true)
    const allGeneratedImages: string[] = []
    
    try {
      // 构建包含比例要求的提示词
      let ratioPrompt = ""
      if (selectedRatio !== "Auto") {
        const ratioDescriptions = {
          "1:1": ", please generate a square image with aspect ratio 1:1",
          "4:3": ", please generate a landscape image with aspect ratio 4:3", 
          "3:4": ", please generate a portrait image with aspect ratio 3:4",
          "16:9": ", please generate a widescreen landscape image with aspect ratio 16:9",
          "9:16": ", please generate a widescreen portrait image with aspect ratio 9:16"
        }
        ratioPrompt = ratioDescriptions[selectedRatio as keyof typeof ratioDescriptions] || `，输出图片比例为${selectedRatio}`
      }
      
      const sanitizedCustomPrompt = customPrompt ? sanitizeInput(customPrompt) : ""
      const fullCustomPrompt = sanitizedCustomPrompt 
        ? `${sanitizedCustomPrompt}${ratioPrompt}` 
        : ratioPrompt.slice(2)

      // 记录总生成时间
      const batchStartTime = Date.now()
      
      // 并行处理所有选中的模板
      setGenerationMessage(`Processing ${selectedTemplates.length} templates simultaneously...`)
      
      // 创建所有生成任务的Promise数组
      const generationPromises = selectedTemplates.map(async (template, index) => {
        const generationStartTime = Date.now()
        
        try {
          // Step 1: 先调用后端API验证并扣除积分
          const prepareResponse = await fetch('/api/generate-pet-art/prepare', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              templateId: template.name,
              templateName: template.name,
              templateCategory: template.category || '',
              aspectRatio: selectedRatio,
            })
          })

          const prepareResult = await prepareResponse.json()

          if (!prepareResponse.ok || !prepareResult.success) {
            console.error(`Failed to prepare generation for template ${index + 1}:`, prepareResult.message)
            return null // 返回null表示该模板生成失败
          }

          const { artwork_id, remaining_credits } = prepareResult.data
          
          // 更新用户积分显示
          setUserCredits(remaining_credits)

          // Step 2: 直接从前端调用 AI API
          // 准备 AI API 请求
          const aiFormData = new FormData()
          
          // 获取模板图片
          const baseUrl = window.location.origin
          const fullTemplateUrl = template.image.startsWith('http') 
            ? template.image 
            : `${baseUrl}${template.image}`
          
          const templateResponse = await fetch(fullTemplateUrl)
          if (!templateResponse.ok) {
            console.error(`Failed to fetch template image for template ${index + 1}`)
            return null
          }
          
          const templateBlob = await templateResponse.blob()
          const templateFile = new File([templateBlob], 'template.jpg', { type: 'image/jpeg' })
          aiFormData.append('image', templateFile)
          
          // 添加用户宠物照片
          aiFormData.append('image', petImage)
          
          // 构建提示词
          const basePrompt = 'Replace the pet in the first image with the pet from the second image, keeping the clothing, style, and background unchanged'
          const prompt = fullCustomPrompt ? `${basePrompt}. ${fullCustomPrompt}` : basePrompt
          aiFormData.append('prompt', prompt)
          
          // 其他参数
          aiFormData.append('n', '1')
          aiFormData.append('response_format', 'url')
          aiFormData.append('model', 'gpt-4o-image')
          aiFormData.append('user', artwork_id)
          
          // 设置图片尺寸
          const sizeMap: Record<string, string> = {
            'Auto': '768x1024',
            '1:1': '1024x1024',
            '4:3': '1024x768',
            '3:4': '768x1024',
            '16:9': '1024x576',
            '9:16': '576x1024'
          }
          
          const size = sizeMap[selectedRatio] || sizeMap['Auto']
          aiFormData.append('size', size)

          // 直接调用 AI API（前端）
          const API_KEY = process.env.NEXT_PUBLIC_PET_AI_API_KEY
          const API_URL = process.env.NEXT_PUBLIC_PET_AI_API_URL || 'https://api.apicore.ai/v1/images/edits'
          
          if (!API_KEY) {
            console.error('AI API key not configured')
            return null
          }
          
          const aiResponse = await fetch(API_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${API_KEY}`
            },
            body: aiFormData,
            signal: AbortSignal.timeout(300000) // 5分钟
          })

          if (!aiResponse.ok) {
            const errorText = await aiResponse.text()
            console.error(`AI API error for template ${index + 1}: ${errorText}`)
            return null
          }

          const aiData = await aiResponse.json()
          
          if (!aiData.data || aiData.data.length === 0) {
            console.error(`No image generated for template ${index + 1}`)
            return null
          }

          const generatedImageUrl = aiData.data[0].url
          const generationTime = Date.now() - generationStartTime

          // 返回生成结果，包括所有必要信息（不再在这里调用complete API）
          return {
            artwork_id,
            url: generatedImageUrl,
            templateName: template.name,
            generationTime,
            prompt,
            customRequirements: fullCustomPrompt
          }
          
        } catch (error) {
          console.error(`Error generating image for template ${index + 1}:`, error)
          return null // 返回null表示该模板生成失败
        }
      })
      
      // 实时更新进度和已生成的图片
      let completedCount = 0
      const totalCount = selectedTemplates.length
      
      // 使用Promise.allSettled确保所有请求都完成（无论成功或失败）
      const results = await Promise.allSettled(generationPromises.map(async (promise, index) => {
        const result = await promise
        completedCount++
        
        // 更新进度
        const overallProgress = (completedCount / totalCount) * 100
        setGenerationProgress(overallProgress)
        setGenerationMessage(`Completed ${completedCount} of ${totalCount} templates`)
        
        // 如果生成成功，立即添加到显示列表
        if (result && result.url) {
          allGeneratedImages.push(result.url)
          setGeneratedImages([...allGeneratedImages])
        }
        
        return result
      }))
      
      // 过滤出成功生成的结果
      const successfulResults = results
        .filter(result => result.status === 'fulfilled' && result.value)
        .map(result => (result as PromiseFulfilledResult<any>).value)
        .filter((result): result is any => result !== null)
      
      // 最终检查是否有成功生成的图片
      if (successfulResults.length === 0) {
        throw new Error('Failed to generate any images')
      }
      
      // 计算总生成时间
      const totalGenerationTime = Date.now() - batchStartTime
      
      // 批量保存结果并发送统一邮件
      if (successfulResults.length > 0) {
        // 如果只有一张图片，使用原来的单个完成API
        if (successfulResults.length === 1) {
          const result = successfulResults[0]
          try {
            const completeResponse = await fetch('/api/generate-pet-art/complete', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                artwork_id: result.artwork_id,
                generated_image_url: result.url,
                generation_time: result.generationTime,
                prompt: result.prompt,
                custom_requirements: result.customRequirements,
              })
            })
            
            if (!completeResponse.ok) {
              console.error('Failed to save single result')
            }
          } catch (error) {
            console.error('Error saving single result:', error)
          }
        } else {
          // 多张图片，使用批量完成API
          try {
            // 先保存每个结果到数据库（不发送邮件）
            for (const result of successfulResults) {
              try {
                await fetch('/api/generate-pet-art/complete', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    artwork_id: result.artwork_id,
                    generated_image_url: result.url,
                    generation_time: result.generationTime,
                    prompt: result.prompt,
                    custom_requirements: result.customRequirements,
                    skip_email: true // 添加标记跳过单个邮件
                  })
                })
              } catch (error) {
                console.error('Error saving individual result:', error)
              }
            }
            
            // 然后发送统一的批量完成邮件
            const batchCompleteResponse = await fetch('/api/generate-pet-art/batch-complete', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                artworks: successfulResults.map(r => ({
                  artwork_id: r.artwork_id,
                  url: r.url,
                  templateName: r.templateName
                })),
                totalGenerationTime
              })
            })
            
            if (!batchCompleteResponse.ok) {
              console.error('Failed to send batch completion notification')
            }
          } catch (error) {
            console.error('Error processing batch completion:', error)
          }
        }
      }
      
      // 如果有部分失败，显示警告
      if (successfulResults.length < selectedTemplates.length) {
        toast.warning(`Generated ${successfulResults.length} of ${selectedTemplates.length} images. Some templates failed.`)
      } else {
        // 全部成功
        toast.success(`Successfully generated all ${successfulResults.length} images!`)
      }
      
      // Complete progress
      setGenerationProgress(100)
      setGenerationMessage(`Generated ${successfulResults.length} image${successfulResults.length > 1 ? 's' : ''}!`)
      
      // 刷新积分显示
      await fetchUserCredits()
      
      // 清理定时器
      clearInterval(progressInterval)
      clearInterval(messageInterval)
      
    } catch (error) {
      // 清理定时器
      clearInterval(progressInterval)
      clearInterval(messageInterval)
      
      setGenerationMessage('Generation failed, please try again')
      alert("Generation failed. Please try again")
      console.error(error)
    } finally {
      setIsGenerating(false)
      // 延迟清理进度状态，让用户看到100%
      setTimeout(() => {
        setGenerationProgress(0)
        setGenerationMessage('')
        setStartTime(null)
      }, 2000)
    }
  }

  const handleDownload = async (imageUrl: string, index: number) => {
    if (imageUrl) {
      try {
        await downloadImage(imageUrl, `pet-art-${index + 1}-${Date.now()}.png`)
      } catch (error) {
        alert("Download failed. Please try again")
      }
    }
  }
  
  const handleDownloadAll = async () => {
    for (let i = 0; i < generatedImages.length; i++) {
      await handleDownload(generatedImages[i], i)
      // 添加小延迟避免同时下载太多文件
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            AI Pet Art Photo <span className="text-primary">Generator</span>
          </h2>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto">Select a style template, upload your pet photo, and generate professional art in one click</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
          {/* 模板选择 */}
          <Card className="lg:col-span-5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🎨</span>
                Select Style
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingTemplates ? (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <div className="animate-spin text-4xl mb-4">⏳</div>
                    <p className="text-muted-foreground">Loading templates...</p>
                  </div>
                </div>
              ) : (
                <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
                  <div className="flex flex-wrap gap-1.5 p-1 mb-4">
                    {templateCategories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                          selectedCategory === category.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                  
                  {templateCategories.map((category) => (
                    <TabsContent key={category.id} value={category.id} className="mt-4">
                      <div className="grid grid-cols-4 gap-2 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                        {(category.id === 'all' 
                          ? Object.values(templates).flat() 
                          : templates[category.id] || []
                        ).map((template, index) => (
                        <div 
                          key={`${template.category}-${index}`} 
                          className={`relative cursor-pointer transition-all duration-300 group ${
                            selectedTemplates.some(t => t.image === template.image)
                              ? 'ring-2 ring-primary' 
                              : 'hover:ring-1 hover:ring-primary/50'
                          }`}
                          onClick={() => {
                            const isSelected = selectedTemplates.some(t => t.image === template.image)
                            if (isSelected) {
                              setSelectedTemplates(selectedTemplates.filter(t => t.image !== template.image))
                              // 如果取消选择的是最后选择的模版，清空最后选择
                              if (lastSelectedTemplate?.image === template.image) {
                                // 选择剩余模版中的最后一个作为预览
                                const remaining = selectedTemplates.filter(t => t.image !== template.image)
                                setLastSelectedTemplate(remaining.length > 0 ? remaining[remaining.length - 1] : null)
                              }
                            } else if (selectedTemplates.length < 8) {
                              setSelectedTemplates([...selectedTemplates, template])
                              setLastSelectedTemplate(template) // 更新最后选择的模版
                            } else {
                              toast.warning("You can select up to 8 templates at once")
                            }
                          }}
                        >
                          <div className="relative aspect-[3/4] rounded-lg overflow-hidden">
                            <Image
                              src={template.image}
                              alt={template.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                            {template.tag && (
                              <Badge
                                variant={template.tag === 'HOT' ? 'destructive' : 'default'}
                                className="absolute top-1 left-1 text-xs"
                              >
                                {template.tag}
                              </Badge>
                            )}
                            {/* 圆形选择按钮 */}
                            <div className="absolute bottom-2 right-2">
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                selectedTemplates.some(t => t.image === template.image)
                                  ? 'bg-primary border-primary'
                                  : 'bg-white/80 border-gray-400 hover:border-primary'
                              }`}>
                                {selectedTemplates.some(t => t.image === template.image) && (
                                  <span className="text-white text-xs font-bold">
                                    {selectedTemplates.findIndex(t => t.image === template.image) + 1}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-center mt-1 truncate">{template.name}</p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            )}
            </CardContent>
          </Card>

          {/* 上传宠物照片 */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📸</span>
                Upload Photo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* AI Limitations Notice */}
              <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
                <p className="font-medium">Important Notes:</p>
                <p className="text-muted-foreground">• Only pet photos supported (no humans)</p>
                <p className="text-muted-foreground">• Best results with clear, well-lit photos</p>
              </div>
              <div>
                <label className="block font-semibold mb-2">Pet Photo</label>
                <div 
                  className="relative border-2 border-dashed border-border rounded-lg p-6 min-h-[300px] flex items-center justify-center"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  {petImagePreview ? (
                    <div className="relative">
                      <Image
                        src={petImagePreview}
                        alt="Pet preview"
                        width={280}
                        height={350}
                        className="object-cover rounded-lg max-w-full max-h-[280px]"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setPetImage(null)
                          setPetImagePreview("")
                        }}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-destructive/90 transition-colors z-10"
                      >
                        ✕
                      </button>
                    </div>
                  ) : showReferenceImage ? (
                    <div className="relative">
                      <Image
                        src="/reference.png"
                        alt="Reference pet image"
                        width={200}
                        height={250}
                        className="object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowReferenceImage(false)
                        }}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-destructive/90 transition-colors z-10"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <div className="text-4xl mb-2">📷</div>
                      <p>Click or drag to upload</p>
                    </div>
                  )}
                  {!petImagePreview && (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePetImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-2">Output Ratio</label>
                <div className="grid grid-cols-3 gap-2">
                  {ratios.map((ratio) => {
                    // Calculate visual rectangle dimensions based on ratio
                    const getRectDimensions = (ratioId: string) => {
                      switch(ratioId) {
                        case "Auto":
                        case "3:4": return { width: 18, height: 24 }
                        case "4:3": return { width: 24, height: 18 }
                        case "1:1": return { width: 20, height: 20 }
                        case "16:9": return { width: 28, height: 16 }
                        case "9:16": return { width: 16, height: 28 }
                        default: return { width: 18, height: 24 }
                      }
                    }
                    const dims = getRectDimensions(ratio.id)
                    
                    return (
                      <button
                        key={ratio.id}
                        onClick={() => setSelectedRatio(ratio.id)}
                        className={`p-2 rounded-lg border transition-all flex flex-col items-center justify-center gap-1.5 min-h-[70px] ${
                          selectedRatio === ratio.id 
                            ? 'bg-primary/10 border-primary ring-2 ring-primary/20' 
                            : 'bg-background border-border hover:border-primary/50'
                        }`}
                      >
                        <div 
                          className={`border-2 ${
                            selectedRatio === ratio.id ? 'border-primary' : 'border-muted-foreground'
                          }`}
                          style={{ 
                            width: `${dims.width}px`, 
                            height: `${dims.height}px`,
                            borderRadius: '2px'
                          }}
                        />
                        <div className={`text-xs font-medium ${
                          selectedRatio === ratio.id ? 'text-primary' : 'text-foreground'
                        }`}>
                          {ratio.label}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Custom Requirements section hidden for now */}
              {/* <div>
                <label className="block font-semibold mb-2">Custom Requirements (Optional)</label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="E.g., Add a Christmas hat, change background to snow scene..."
                  className="w-full h-20 px-3 py-2 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div> */}

              <Button 
                onClick={() => {
                  // 如果没有宠物照片但有参考图片，显示提示
                  if (!petImage && showReferenceImage) {
                    setShowTipDialog(true)
                    return
                  }
                  // 否则直接生成
                  handleGenerate()
                }}
                disabled={(!petImage && !showReferenceImage) || isGenerating}
                className="w-full bg-primary hover:bg-primary/90"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Generating... ({Math.round(generationProgress)}%)
                  </>
                ) : (
                  <>
                    <span className="mr-2">✨</span>
                    Generate {selectedTemplates.length > 0 ? `${selectedTemplates.length} Art Photo${selectedTemplates.length > 1 ? 's' : ''}` : 'Art Photo'} ({selectedTemplates.length || 1} credit{selectedTemplates.length > 1 ? 's' : ''})
                  </>
                )}
              </Button>
              
              {/* 生成进度显示 */}
              {isGenerating && (
                <div className="mt-4 space-y-3">
                  {/* 进度条 */}
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>
                  
                  {/* 状态消息 */}
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground animate-pulse">
                      {generationMessage}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Estimated time: 2-3 minutes, please be patient...
                    </p>
                  </div>
                  
                  {/* 倒计时显示 */}
                  {startTime && (
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">
                        Elapsed: {Math.round((Date.now() - startTime) / 1000)} seconds
                      </div>
                      <div className="text-xs text-muted-foreground/50 mt-1">
                        {(Date.now() - startTime) < 180000 
                          ? `Remaining: ~${Math.max(0, 180 - Math.round((Date.now() - startTime) / 1000))} seconds`
                          : 'Processing... Please wait a moment longer'
                        }
                      </div>
                    </div>
                  )}
                  
                  {/* 温馨提示 */}
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <span className="text-blue-500 text-sm">💡</span>
                      <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                        <p>• You can download the HD image after generation</p>
                        <p>• Please keep this page open during generation</p>
                        <p>• Each generation will consume 1 credit</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 生成结果 */}
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>✨</span>
                Generated Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative border-2 border-dashed border-border rounded-lg p-6 min-h-[400px] flex items-center justify-center bg-muted/20">
                {/* 生成中的动画效果 */}
                {isGenerating && generatedImages.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg z-20">
                    <div className="text-center">
                      {/* 主动画 */}
                      <div className="relative w-32 h-32 mx-auto mb-6">
                        {/* 外圈旋转 */}
                        <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-ping" />
                        <div className="absolute inset-0 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
                        
                        {/* 中心图标 */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-5xl animate-pulse">🎨</div>
                        </div>
                      </div>
                      
                      {/* Text prompt */}
                      <h3 className="text-lg font-semibold mb-2">AI is creating...</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {generationMessage}
                      </p>
                      
                      {/* 进度百分比 */}
                      <div className="text-2xl font-bold text-primary mb-2">
                        {Math.round(generationProgress)}%
                      </div>
                      
                      {/* 预计剩余时间 */}
                      {startTime && (
                        <p className="text-xs text-muted-foreground">
                          {(Date.now() - startTime) < 180000 
                            ? `Remaining: ~${Math.max(0, 180 - Math.round((Date.now() - startTime) / 1000))} seconds`
                            : 'Processing... Please wait a moment longer'
                          }
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {generatedImages.length > 0 ? (
                  <div className="w-full">
                    {/* 单张图片或多张图片的不同展示 */}
                    {generatedImages.length === 1 ? (
                      // 单张图片展示
                      <div className="relative">
                        <Image
                          src={generatedImages[0]}
                          alt="Generated art"
                          width={400}
                          height={400}
                          className="object-contain rounded-lg"
                          unoptimized
                        />
                      </div>
                    ) : (
                      // 多张图片网格展示
                      <div className="grid grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                        {generatedImages.map((image, index) => (
                          <div key={index} className="relative group">
                            <Image
                              src={image}
                              alt={`Generated art ${index + 1}`}
                              width={200}
                              height={200}
                              className="object-contain rounded-lg w-full h-auto"
                              unoptimized
                            />
                            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                onClick={() => handleDownload(image, index)}
                                size="sm"
                                variant="secondary"
                                className="bg-white/90 hover:bg-white"
                              >
                                <span className="text-xs">💾 #{index + 1}</span>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : petImage && selectedTemplates.length > 0 ? (
                  // 如果已上传宠物照片且选择了模板，只显示选择信息
                  <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                    <div className="space-y-6">
                      {/* 圆形进度指示器 */}
                      <div className="mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-3xl font-bold text-primary">{selectedTemplates.length}</span>
                      </div>
                      
                      {/* 状态文本 */}
                      <div className="text-center space-y-2">
                        <p className="text-xl font-semibold text-foreground">
                          Template{selectedTemplates.length > 1 ? 's' : ''} Selected
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Pet Photo Uploaded
                        </p>
                      </div>
                      
                      {/* 准备状态提示 */}
                      <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400">
                        <div className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-400 animate-pulse"></div>
                        <span>Ready to generate your artwork</span>
                      </div>
                    </div>
                  </div>
                ) : petImage && selectedTemplates.length === 0 ? (
                  // 如果已上传宠物照片但没有选择模板
                  <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                    <div className="space-y-4">
                      <div className="mx-auto w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
                        <span className="text-3xl">📸</span>
                      </div>
                      <div className="text-center space-y-2">
                        <p className="text-lg font-semibold text-foreground">Pet Photo Uploaded</p>
                        <p className="text-sm text-muted-foreground">Please select at least one template to continue</p>
                      </div>
                    </div>
                  </div>
                ) : !petImage && lastSelectedTemplate ? (
                  // 只显示最后选择的模板预览（没有上传宠物照片时）
                  (() => {
                    const previewImagePath = getPreviewImagePath(lastSelectedTemplate.image)
                    // 检查预览路径是否有效
                    if (!previewImagePath || previewImagePath === '') {
                      // 如果预览路径无效，显示占位内容
                      return (
                        <div className="relative">
                          <div className="w-[400px] h-[400px] bg-muted/30 rounded-lg flex items-center justify-center">
                            <div className="text-center text-muted-foreground">
                              <div className="text-6xl mb-4">✨</div>
                              <p className="text-lg">Template selected: {lastSelectedTemplate.name.split(' - ')[0]}</p>
                              <p className="text-sm mt-2">Preview will be available soon</p>
                            </div>
                          </div>
                          <div className="absolute top-2 left-2">
                            <Badge variant="default" className="bg-primary/90">
                              {selectedTemplates.length} template{selectedTemplates.length > 1 ? 's' : ''} selected
                            </Badge>
                          </div>
                          <div className="absolute bottom-2 left-2 right-2">
                            <Badge variant="secondary" className="w-full justify-center">
                              Preview: {lastSelectedTemplate.name.split(' - ')[0]}
                            </Badge>
                          </div>
                        </div>
                      )
                    }
                    
                    // 如果预览路径有效，显示预览图片
                    return (
                      <div className="relative">
                        <Image
                          src={previewImagePath}
                          alt={`${lastSelectedTemplate.name} preview`}
                          width={400}
                          height={400}
                          className="object-contain rounded-lg"
                          priority
                          unoptimized
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            target.parentElement!.innerHTML = `
                              <div class="text-center text-muted-foreground">
                                <div class="text-6xl mb-4">✨</div>
                                <p class="text-lg">Template selected: ${lastSelectedTemplate.name}</p>
                                <p class="text-sm mt-2">Preview will be available soon</p>
                              </div>
                            `
                          }}
                        />
                        <div className="absolute top-2 left-2">
                          <Badge variant="default" className="bg-primary/90">
                            {selectedTemplates.length} template{selectedTemplates.length > 1 ? 's' : ''} selected
                          </Badge>
                        </div>
                        <div className="absolute bottom-2 left-2 right-2">
                          <Badge variant="secondary" className="w-full justify-center">
                            Preview: {lastSelectedTemplate.name.split(' — ')[0]}
                          </Badge>
                        </div>
                      </div>
                    )
                  })()
                ) : (
                  <div className="text-center text-muted-foreground">
                    <div className="text-6xl mb-4">🎨</div>
                    <p className="text-lg">Generated art photo will appear here</p>
                    <p className="text-sm mt-2">Select a template and upload a photo, then click generate</p>
                  </div>
                )}
              </div>

              {generatedImages.length > 0 && (
                <div className="mt-6 space-y-3">
                  {generatedImages.length === 1 ? (
                    <Button 
                      onClick={() => handleDownload(generatedImages[0], 0)}
                      variant="outline"
                      className="w-full"
                      size="lg"
                    >
                      <span className="mr-2">💾</span>
                      Download Image
                    </Button>
                  ) : (
                    <>
                      <Button 
                        onClick={handleDownloadAll}
                        variant="outline"
                        className="w-full"
                        size="lg"
                      >
                        <span className="mr-2">💾</span>
                        Download All {generatedImages.length} Images
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        Or hover over each image above to download individually
                      </p>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 美观的提示弹窗 */}
        <Dialog open={showTipDialog} onOpenChange={setShowTipDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <span className="text-2xl">💡</span>
                Ready to Generate?
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="text-center">
                <div className="text-6xl mb-4">🎨</div>
                <p className="text-muted-foreground text-base leading-relaxed">
                  To create your pet art, please:
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold text-sm">1</span>
                  </div>
                  <div>
                    <p className="font-medium">Select a Template</p>
                    <p className="text-sm text-muted-foreground">Choose an art style from the left panel</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold text-sm">2</span>
                  </div>
                  <div>
                    <p className="font-medium">Upload Pet Photo</p>
                    <p className="text-sm text-muted-foreground">Add a clear photo of your pet</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-center">
                <Button 
                  onClick={() => setShowTipDialog(false)}
                  className="px-8 py-2"
                >
                  Got it! ✨
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  )
}