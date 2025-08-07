"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import { petTemplates, templateCategories, getTemplatesByCategory, type PetTemplate } from "@/lib/petTemplates"
import { generatePetArt, downloadImage } from "@/lib/petAiApi"
import { useAppContext } from "@/contexts/app"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

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
  const [showReferenceImage, setShowReferenceImage] = useState(true)
  const [userCredits, setUserCredits] = useState<number>(0)

  // 获取用户积分
  useEffect(() => {
    if (user) {
      fetchUserCredits()
    }
  }, [user])

  const fetchUserCredits = async () => {
    try {
      const resp = await fetch("/api/get-user-credits", {
        method: "POST",
      })
      
      if (resp.ok) {
        const { data } = await resp.json()
        setUserCredits(data.credits || 0)
      }
    } catch (error) {
      console.error("Failed to fetch user credits:", error)
    }
  }

  const ratios = [
    { id: "Auto", label: "Auto", description: "Auto ratio" },
    { id: "1:1", label: "1:1", description: "Square" },
    { id: "4:3", label: "4:3", description: "Landscape" },
    { id: "3:4", label: "3:4", description: "Portrait" },
    { id: "16:9", label: "16:9", description: "Widescreen" },
    { id: "9:16", label: "9:16", description: "Mobile" }
  ]

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('Image file cannot exceed 10MB')
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
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file) {
      processImageFile(file)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const handleGenerate = async () => {
    if (!petImage || !selectedTemplate) {
      alert("请上传宠物照片并选择一个模板")
      return
    }

    // 检查用户是否登录
    if (!session || !user) {
      setShowSignModal(true)
      return
    }

    // 检查用户积分
    if (userCredits < 1) {
      alert("积分不足，请前往充值页面购买积分")
      router.push("/pricing")
      return
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
      
      const fullCustomPrompt = customPrompt 
        ? `${customPrompt}${ratioPrompt}` 
        : ratioPrompt.slice(1)

      const resultUrl = await generatePetArt(
        petImage,
        selectedTemplate.image,
        fullCustomPrompt,
        selectedRatio
      )
      setGeneratedImage(resultUrl)
      
      // 更新用户积分
      setUserCredits(prev => Math.max(0, prev - 1))
      
      // TODO: 保存生成记录到数据库
      
    } catch (error) {
      alert("生成失败，请重试")
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async () => {
    if (generatedImage) {
      try {
        await downloadImage(generatedImage, `pet-art-${Date.now()}.png`)
      } catch (error) {
        alert("下载失败，请重试")
      }
    }
  }

  return (
    <section className="bg-background py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            AI宠物艺术照 <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">生成器</span>
          </h2>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto">选择风格模板，上传宠物照片，一键生成专属艺术照</p>
          {user && (
            <div className="mt-4">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                剩余积分: {userCredits}
              </Badge>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
          {/* 模板选择 */}
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🎨</span>
                选择风格
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
                <TabsList className="w-full h-auto p-1 flex flex-wrap gap-1">
                  {templateCategories.map((category) => (
                    <TabsTrigger 
                      key={category.id}
                      value={category.id} 
                      className="text-xs px-3 py-2"
                    >
                      {category.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {templateCategories.map((category) => (
                  <TabsContent key={category.id} value={category.id} className="mt-4">
                    <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                      {getTemplatesByCategory(category.id).map((template) => (
                        <div 
                          key={template.id} 
                          className={`relative cursor-pointer transition-all duration-300 group ${
                            selectedTemplate?.id === template.id 
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
                                className={`absolute top-1 left-1 text-xs ${
                                  template.tag === 'HOT' 
                                    ? 'bg-red-500' 
                                    : 'bg-green-500'
                                } text-white`}
                              >
                                {template.tag}
                              </Badge>
                            )}
                            {selectedTemplate?.id === template.id && (
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
            </CardContent>
          </Card>

          {/* 上传宠物照片 */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📸</span>
                上传照片
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block font-semibold mb-2">宠物照片</label>
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
                        onClick={() => {
                          setPetImage(null)
                          setPetImagePreview("")
                        }}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm"
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
                          e.preventDefault()
                          setShowReferenceImage(false)
                        }}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <div className="text-4xl mb-2">📷</div>
                      <p>点击或拖拽上传</p>
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
                <label className="block font-semibold mb-2">输出比例</label>
                <div className="grid grid-cols-3 gap-2">
                  {ratios.map((ratio) => (
                    <button
                      key={ratio.id}
                      onClick={() => setSelectedRatio(ratio.id)}
                      className={`px-3 py-2 rounded-lg border transition-all ${
                        selectedRatio === ratio.id 
                          ? 'bg-primary text-primary-foreground border-primary' 
                          : 'bg-background border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="text-sm font-medium">{ratio.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-2">自定义要求（可选）</label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="例如：添加圣诞帽，背景换成雪景..."
                  className="w-full h-20 px-3 py-2 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </CardContent>
          </Card>

          {/* 生成结果 */}
          <Card className="lg:col-span-5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>✨</span>
                生成结果
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative border-2 border-dashed border-border rounded-lg p-6 min-h-[400px] flex items-center justify-center bg-muted/10">
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
                ) : (
                  <div className="text-center text-muted-foreground">
                    <div className="text-6xl mb-4">🎨</div>
                    <p className="text-lg">生成的艺术照将在这里显示</p>
                    <p className="text-sm mt-2">选择模板并上传照片后点击生成</p>
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-6">
                <Button 
                  onClick={handleGenerate}
                  disabled={!petImage || !selectedTemplate || isGenerating}
                  className="flex-1"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      生成中...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">✨</span>
                      生成艺术照 (消耗1积分)
                    </>
                  )}
                </Button>
                
                {generatedImage && (
                  <Button 
                    onClick={handleDownload}
                    variant="outline"
                    size="lg"
                  >
                    <span className="mr-2">💾</span>
                    下载图片
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}