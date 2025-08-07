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
  { id: "all", name: "全部", description: "所有风格模板" },
  { id: "photography", name: "摄影写真", description: "专业摄影风格" },
  { id: "gongbi", name: "工笔画风格", description: "中国传统工笔画" },
  { id: "cartoon", name: "卡通风格", description: "可爱卡通造型" },
  { id: "cute", name: "萌系风格", description: "超萌可爱风格" }
]

export const petTemplates: PetTemplate[] = [
  // 摄影写真分类
  {
    id: "ai-portrait",
    name: "AI专业写真",
    image: "/templates/photography/AI宠物写真_Midjourney绘画_2_AI爱好者-暖风_来自小红书网页版.png",
    description: "AI生成专业写真风格",
    category: "photography",
    tag: "NEW"
  },
  {
    id: "corgi-photo-2",
    name: "柯基写真·经典",
    image: "/templates/photography/Corgi Photo.jpg",
    description: "经典柯基摄影造型",
    category: "photography",
    tag: "HOT"
  },
  {
    id: "fashion-portrait",
    name: "时尚写真",
    image: "/templates/photography/时装.jpg",
    description: "专业时尚摄影风格",
    category: "photography",
    tag: "NEW"
  },

  // 工笔画风格分类
  {
    id: "gongbi-bichon-1",
    name: "工笔比熊·雅致",
    image: "/templates/gongbi/工笔风比熊合集_1_四只脚宠物摄影_来自小红书网页版.jpg",
    description: "中国传统工笔画风格",
    category: "gongbi",
    tag: "HOT"
  },
  {
    id: "gongbi-bichon-2",
    name: "工笔比熊·精美",
    image: "/templates/gongbi/工笔风比熊合集_2_四只脚宠物摄影_来自小红书网页版.jpg",
    description: "精美工笔画艺术",
    category: "gongbi",
    tag: "HOT"
  },
  {
    id: "gongbi-bichon-6",
    name: "工笔比熊·优雅",
    image: "/templates/gongbi/工笔风比熊合集_6_四只脚宠物摄影_来自小红书网页版.jpg",
    description: "传统工笔技法",
    category: "gongbi",
    tag: "NEW"
  },
  {
    id: "gongbi-bichon-10",
    name: "工笔比熊·古典",
    image: "/templates/gongbi/工笔风比熊合集_10_四只脚宠物摄影_来自小红书网页版.jpg",
    description: "古典工笔风格",
    category: "gongbi"
  },

  // 卡通风格分类
  {
    id: "cat-cartoon-1",
    name: "梦幻猫咪",
    image: "/templates/cartoon/宠物赛道思路打开了吗？猫咪图案_1_鱼吐泡泡糖_来自小红书网页版.jpg",
    description: "梦幻风格猫咪艺术",
    category: "cartoon",
    tag: "NEW"
  },
  {
    id: "cat-cartoon-2",
    name: "唯美猫咪",
    image: "/templates/cartoon/宠物赛道思路打开了吗？猫咪图案_2_鱼吐泡泡糖_来自小红书网页版.jpg",
    description: "唯美卡通猫咪造型",
    category: "cartoon",
    tag: "HOT"
  },
  {
    id: "cat-cartoon-9",
    name: "奇幻猫咪",
    image: "/templates/cartoon/宠物赛道思路打开了吗？猫咪图案_9_鱼吐泡泡糖_来自小红书网页版.jpg",
    description: "奇幻世界猫咪",
    category: "cartoon"
  },
  {
    id: "cat-cartoon-10",
    name: "浪漫猫咪",
    image: "/templates/cartoon/宠物赛道思路打开了吗？猫咪图案_10_鱼吐泡泡糖_来自小红书网页版.jpg",
    description: "浪漫风格猫咪",
    category: "cartoon",
    tag: "HOT"
  },
  {
    id: "cat-cartoon-11",
    name: "华丽猫咪",
    image: "/templates/cartoon/宠物赛道思路打开了吗？猫咪图案_11_鱼吐泡泡糖_来自小红书网页版.jpg",
    description: "华丽装饰风格",
    category: "cartoon"
  }
]

// 根据分类过滤模板
export const getTemplatesByCategory = (categoryId: string): PetTemplate[] => {
  if (categoryId === "all") {
    return petTemplates
  }
  return petTemplates.filter(template => template.category === categoryId)
}