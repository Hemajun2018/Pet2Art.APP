"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import { getPreviewImagePath, type PetTemplate, type TemplateCategory } from "@/lib/petTemplates"
import { downloadImage } from "@/lib/petAiApi"
import { useAppContext } from "@/contexts/app"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { validateImageFile, checkProhibitedContent, sanitizeInput } from "@/lib/contentFilter"

export default function PetArtGenerator() {
  const router = useRouter()
  const { data: session } = useSession()
  const { user, setShowSignModal } = useAppContext()
  
  const [selectedTemplate, setSelectedTemplate] = useState<PetTemplate | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [petImage, setPetImage] = useState<File | null>(null)
  const [petImagePreview, setPetImagePreview] = useState<string>("")
  const [selectedRatio, setSelectedRatio] = useState<string>("Auto")
  const [customPrompt, setCustomPrompt] = useState("")
  const [generatedImage, setGeneratedImage] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationMessage, setGenerationMessage] = useState('')
  const [startTime, setStartTime] = useState<number | null>(null)
  const [showReferenceImage, setShowReferenceImage] = useState(true)
  const [userCredits, setUserCredits] = useState<number>(0)
  const [templateCategories, setTemplateCategories] = useState<TemplateCategory[]>([])
  const [templates, setTemplates] = useState<Record<string, PetTemplate[]>>({})
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true)

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
        
        // 默认选择第一个模板
        const firstCategory = data.categories.find((cat: TemplateCategory) => cat.id === 'all') || data.categories[0]
        if (firstCategory) {
          const allTemplates = firstCategory.id === 'all' 
            ? Object.values(data.templates).flat() 
            : data.templates[firstCategory.id]
          if (allTemplates && allTemplates.length > 0) {
            setSelectedTemplate(allTemplates[0])
          }
        }
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
    if (!petImage || !selectedTemplate) {
      alert("Please upload a pet photo and select a template")
      return
    }
    
    // Reset progress state
    setGenerationProgress(0)
    setGenerationMessage('Preparing to generate...')
    setStartTime(Date.now())
    
    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) return prev // Stop at 90% until actual completion
        return Math.min(prev + Math.random() * 8 + 2, 90)
      })
    }, 3000)
    
    // Update status messages
    const messages = [
      'Analyzing your pet photo...',
      'Identifying pet features...',
      'Applying artistic style...',
      'Enhancing details...',
      'AI is creating your masterpiece...',
      'Almost done, please wait...'
    ]
    let messageIndex = 0
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % messages.length
      setGenerationMessage(messages[messageIndex])
    }, 8000)

    // 检查用户是否登录
    if (!session || !user) {
      setShowSignModal(true)
      return
    }

    // 检查用户积分
    if (userCredits < 1) {
      alert("Insufficient credits. Please purchase credits on the pricing page")
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

    setIsGenerating(true)
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

      // 调用后端API生成图片（包含积分扣除和作品保存）
      const formData = new FormData()
      formData.append('petImage', petImage)
      formData.append('templateImageUrl', selectedTemplate.image)
      formData.append('customPrompt', fullCustomPrompt)
      formData.append('aspectRatio', selectedRatio)
      formData.append('templateId', selectedTemplate.name)
      formData.append('templateName', selectedTemplate.name)
      formData.append('templateCategory', selectedTemplate.category || '')

      const response = await fetch('/api/generate-pet-art', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Generation failed')
      }

      setGeneratedImage(result.data.generated_image_url)
      
      // Complete progress
      setGenerationProgress(100)
      setGenerationMessage('Generation complete!')
      
      // 更新用户积分
      setUserCredits(result.data.remaining_credits)
      
      // 刷新积分显示
      await fetchUserCredits()
      
      // 显示成功提示
      const elapsed = startTime ? Math.round((Date.now() - startTime) / 1000) : 0
      console.log(`Generation completed in ${elapsed} seconds`)
      
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

  const handleDownload = async () => {
    if (generatedImage) {
      try {
        await downloadImage(generatedImage, `pet-art-${Date.now()}.png`)
      } catch (error) {
        alert("Download failed. Please try again")
      }
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
                            selectedTemplate?.image === template.image 
                              ? 'ring-2 ring-primary' 
                              : 'hover:ring-1 hover:ring-primary/50'
                          }`}
                          onClick={() => setSelectedTemplate(template)}
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
                            {selectedTemplate?.image === template.image && (
                              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center">
                                  ✓
                                </div>
                              </div>
                            )}
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
                <p className="text-muted-foreground">• Processing takes 10-30 seconds</p>
                <p className="text-muted-foreground">• Results may vary based on photo quality</p>
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

              <div>
                <label className="block font-semibold mb-2">Custom Requirements (Optional)</label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="E.g., Add a Christmas hat, change background to snow scene..."
                  className="w-full h-20 px-3 py-2 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <Button 
                onClick={handleGenerate}
                disabled={!petImage || !selectedTemplate || isGenerating}
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
                    Generate Art Photo (1 credit)
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
                        Remaining: {Math.max(0, 120 - Math.round((Date.now() - startTime) / 1000))} seconds
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
                {isGenerating && !generatedImage && (
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
                          Remaining: {Math.max(0, 120 - Math.round((Date.now() - startTime) / 1000))} seconds
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {generatedImage ? (
                  <div className="relative">
                    <Image
                      src={generatedImage}
                      alt="Generated art"
                      width={400}
                      height={400}
                      className="object-contain rounded-lg"
                      unoptimized
                    />
                  </div>
                ) : selectedTemplate && !petImage ? (
                  <div className="relative">
                    <Image
                      src={getPreviewImagePath(selectedTemplate.image)}
                      alt={`${selectedTemplate.name} preview`}
                      width={400}
                      height={400}
                      className="object-contain rounded-lg"
                      priority
                      unoptimized
                      onError={(e) => {
                        // 如果预览图不存在，显示默认内容
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.parentElement!.innerHTML = `
                          <div class="text-center text-muted-foreground">
                            <div class="text-6xl mb-4">✨</div>
                            <p class="text-lg">Template selected: ${selectedTemplate.name}</p>
                            <p class="text-sm mt-2">Preview will be available soon</p>
                          </div>
                        `
                      }}
                    />
                    <button
                      onClick={() => setSelectedTemplate(null)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-destructive/90 transition-colors z-10"
                    >
                      ✕
                    </button>
                    <div className="absolute bottom-2 left-2 right-2">
                      <Badge variant="secondary" className="w-full justify-center">
                        Preview: {(() => {
                          const dashIndex = selectedTemplate.name.indexOf(' — ')
                          return dashIndex > -1 ? selectedTemplate.name.substring(0, dashIndex) : selectedTemplate.name
                        })()}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <div className="text-6xl mb-4">🎨</div>
                    <p className="text-lg">Generated art photo will appear here</p>
                    <p className="text-sm mt-2">Select a template and upload a photo, then click generate</p>
                  </div>
                )}
              </div>

              {generatedImage && (
                <div className="mt-6">
                  <Button 
                    onClick={handleDownload}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <span className="mr-2">💾</span>
                    Download Image
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}