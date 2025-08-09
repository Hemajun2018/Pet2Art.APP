"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import styles from "./DynamicPhotoWall.module.css"

const photoWallImages = [
  "1.jpg",
  "il_1588xN.5188156331_9i1k.jpg",
  "il_1588xN.6434947046_p3z2.webp",
  "il_1588xN.6484690313_28yt.jpg",
  "il_1588xN.6649126408_gmw1.jpg",
  "il_1588xN.6724797153_hdnw.jpg",
  "il_1588xN.6724805201_rog1.avif",
  "il_1588xN.6788440062_tesq.webp",
  "il_1588xN.6835968985_h8e0.jpg",
  "il_1588xN.6908477065_t7az.jpg",
  "il_1588xN.6952364152_gy3c.avif",
  "pet-art-1753408327965.png",
  "不用豆❗借你们家毛孩子画一下好吗❗_1_丽姐宠物写真画像_来自小红书网页版.jpg",
  "不用豆❗可以借你们家狗狗画一下嘛❗_1_丽姐宠物写真画像_来自小红书网页版.jpg",
  "借你们家小狗化一下可以嘛❗_1_丽姐宠物写真画像_来自小红书网页版.jpg",
  "借你们家毛孩子照片给我画一下好吗❗兔❗米_1_丽姐宠物写真画像_来自小红书网页版.jpg",
  "借你们家毛孩子给我化一下好吗❗_1_丽姐宠物写真画像_来自小红书网页版 (1).jpg",
  "借你们家毛孩子给我化一下好吗❗_1_丽姐宠物写真画像_来自小红书网页版.jpg",
  "别滑走❗可以借你家毛孩子照片画一副嘛_1_丽姐宠物写真画像_来自小红书网页版 (1).jpg",
  "别滑走❗可以借你家毛孩子照片画一副嘛_1_丽姐宠物写真画像_来自小红书网页版.jpg",
  "可以借你们家毛孩子化一副嘛❗_1_丽姐宠物写真画像_来自小红书网页版.jpg",
  "可以借你们家毛孩子照片画一副嘛❗兔❗米_1_丽姐宠物写真画像_来自小红书网页版.jpg",
  "我也拥有免费小狗写真啦！_2_Hia_来自小红书网页版.jpg",
  "我可以画一下你家毛孩子嘛？无尝_1_丽姐宠物写真画像_来自小红书网页版.jpg",
  "猫侠客的勇气之旅🗡️🐱💧🏞️_1_SAGAWIT._来自小红书网页版.jpg",
  "猫侠客的勇气之旅🗡️🐱💧🏞️_2_SAGAWIT._来自小红书网页版.jpg",
  "猫侠客的勇气之旅🗡️🐱💧🏞️_3_SAGAWIT._来自小红书网页版.jpg",
  "猫咪就要圆圆的_1_青鱼追梦_来自小红书网页版.jpg",
  "猫咪就要圆圆的_2_青鱼追梦_来自小红书网页版.jpg",
  "猫咪就要圆圆的_5_青鱼追梦_来自小红书网页版.jpg",
  "猫猫贵族的复古风_1_Lemon_来自小红书网页版.jpg"
]

export default function DynamicPhotoWall() {
  const [columns, setColumns] = useState<string[][]>([])

  useEffect(() => {
    // 将图片分成4列
    const cols: string[][] = [[], [], [], []]
    photoWallImages.forEach((img, index) => {
      cols[index % 4].push(img)
    })
    
    // 复制每列图片以实现无缝循环
    const duplicatedCols = cols.map(col => [...col, ...col, ...col])
    setColumns(duplicatedCols)
  }, [])

  return (
    <section className="py-20 overflow-hidden bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Gallery of <span className="text-primary">Amazing Creations</span>
          </h2>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
            Explore the stunning pet art created by our AI technology
          </p>
        </div>

        <div className="relative h-[900px] overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
          
          <div className="flex gap-4 h-full justify-center">
            {columns.map((column, columnIndex) => (
              <div
                key={columnIndex}
                className={`flex flex-col gap-4 w-[240px] ${styles.scrollColumn} ${
                  columnIndex % 2 === 0 ? styles.scrollUp : styles.scrollDown
                }`}
              >
                {column.map((image, imageIndex) => (
                  <div
                    key={`${columnIndex}-${imageIndex}`}
                    className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex-shrink-0"
                    style={{ height: '320px' }}
                  >
                    <Image
                      src={`/Photo Wall/${image}`}
                      alt={`Gallery image ${imageIndex + 1}`}
                      fill
                      className="object-cover hover:scale-110 transition-transform duration-300"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}