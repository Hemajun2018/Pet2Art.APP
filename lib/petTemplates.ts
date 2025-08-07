export interface PetTemplate {
  id: string
  name: string
  image: string
  description: string
  category: string
  tag?: "HOT" | "NEW"
}

export interface TemplateCategory {
  id: string
  name: string
  description: string
}

export const templateCategories: TemplateCategory[] = [
  { id: "all", name: "All", description: "All style templates" },
  { id: "photography", name: "Photography", description: "Professional photography style" },
  { id: "gongbi", name: "Traditional Art", description: "Traditional Chinese art style" },
  { id: "cartoon", name: "Cartoon", description: "Cute cartoon style" },
  { id: "cute", name: "Cute Style", description: "Super cute style" }
]

export const petTemplates: PetTemplate[] = [
  // 摄影写真分类
  {
    id: "ai-portrait",
    name: "AI Professional",
    image: "/templates/photography/AI宠物写真_Midjourney绘画_2_AI爱好者-暖风_来自小红书网页版.png",
    description: "AI-generated professional portrait style",
    category: "photography",
    tag: "NEW"
  },
  {
    id: "corgi-photo-2",
    name: "Corgi Classic",
    image: "/templates/photography/Corgi Photo.jpg",
    description: "Classic Corgi photography style",
    category: "photography",
    tag: "HOT"
  },
  {
    id: "fashion-portrait",
    name: "Fashion Portrait",
    image: "/templates/photography/时装.jpg",
    description: "Professional fashion photography style",
    category: "photography",
    tag: "NEW"
  },

  // 工笔画风格分类
  {
    id: "gongbi-bichon-1",
    name: "Traditional Bichon",
    image: "/templates/gongbi/工笔风比熊合集_1_四只脚宠物摄影_来自小红书网页版.jpg",
    description: "Traditional Chinese painting style",
    category: "gongbi",
    tag: "HOT"
  },
  {
    id: "gongbi-bichon-2",
    name: "Elegant Bichon",
    image: "/templates/gongbi/工笔风比熊合集_2_四只脚宠物摄影_来自小红书网页版.jpg",
    description: "Exquisite traditional art style",
    category: "gongbi",
    tag: "HOT"
  },
  {
    id: "gongbi-bichon-6",
    name: "Graceful Bichon",
    image: "/templates/gongbi/工笔风比熊合集_6_四只脚宠物摄影_来自小红书网页版.jpg",
    description: "Traditional painting technique",
    category: "gongbi",
    tag: "NEW"
  },
  {
    id: "gongbi-bichon-10",
    name: "Classic Bichon",
    image: "/templates/gongbi/工笔风比熊合集_10_四只脚宠物摄影_来自小红书网页版.jpg",
    description: "Classical traditional style",
    category: "gongbi"
  },

  // 卡通风格分类
  {
    id: "cat-cartoon-1",
    name: "Dream Cat",
    image: "/templates/cartoon/宠物赛道思路打开了吗？猫咪图案_1_鱼吐泡泡糖_来自小红书网页版.jpg",
    description: "Dreamy cat art style",
    category: "cartoon",
    tag: "NEW"
  },
  {
    id: "cat-cartoon-2",
    name: "Beautiful Cat",
    image: "/templates/cartoon/宠物赛道思路打开了吗？猫咪图案_2_鱼吐泡泡糖_来自小红书网页版.jpg",
    description: "Beautiful cartoon cat style",
    category: "cartoon",
    tag: "HOT"
  },
  {
    id: "cat-cartoon-9",
    name: "Fantasy Cat",
    image: "/templates/cartoon/宠物赛道思路打开了吗？猫咪图案_9_鱼吐泡泡糖_来自小红书网页版.jpg",
    description: "Fantasy world cat style",
    category: "cartoon"
  },
  {
    id: "cat-cartoon-10",
    name: "Romantic Cat",
    image: "/templates/cartoon/宠物赛道思路打开了吗？猫咪图案_10_鱼吐泡泡糖_来自小红书网页版.jpg",
    description: "Romantic cat style",
    category: "cartoon",
    tag: "HOT"
  },
  {
    id: "cat-cartoon-11",
    name: "Gorgeous Cat",
    image: "/templates/cartoon/宠物赛道思路打开了吗？猫咪图案_11_鱼吐泡泡糖_来自小红书网页版.jpg",
    description: "Gorgeous decorative style",
    category: "cartoon"
  }
]

// Filter templates by category
export const getTemplatesByCategory = (categoryId: string): PetTemplate[] => {
  if (categoryId === "all") {
    return petTemplates
  }
  return petTemplates.filter(template => template.category === categoryId)
}