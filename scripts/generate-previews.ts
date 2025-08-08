import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const API_KEY = process.env.NEXT_PUBLIC_PET_AI_API_KEY || 'sk-5Um5ukgkeWI6dxB8Z3JUq6MYbpz1biNQMJ4j44uCSBe5gMTk'
const API_URL = 'https://api.apicore.ai/v1/images/edits'

const TEMPLATES_DIR = path.join(__dirname, '../public/templates')
const PREVIEWS_DIR = path.join(__dirname, '../public/previews')
const REFERENCE_IMAGE = path.join(__dirname, '../public/reference.png')

const isDryRun = process.argv.includes('--dry-run')

interface MissingPreview {
  category: string
  templatePath: string
  templateName: string
  previewPath: string
  previewName: string
}

function getPreviewName(templateName: string): string {
  const lastDotIndex = templateName.lastIndexOf('.')
  const nameWithoutExt = templateName.substring(0, lastDotIndex)
  const extension = templateName.substring(lastDotIndex)
  
  const dashIndex = nameWithoutExt.indexOf(' — ')
  const previewName = dashIndex > -1 ? nameWithoutExt.substring(0, dashIndex) : nameWithoutExt
  
  return `${previewName}${extension}`
}

async function scanForMissingPreviews(): Promise<MissingPreview[]> {
  const missingPreviews: MissingPreview[] = []
  
  try {
    const categories = await fs.readdir(TEMPLATES_DIR)
    
    for (const category of categories) {
      const categoryPath = path.join(TEMPLATES_DIR, category)
      const stats = await fs.stat(categoryPath)
      
      if (!stats.isDirectory()) continue
      if (category === 'cute') continue
      
      console.log(`\n📁 Scanning category: ${category}`)
      
      const templateFiles = await fs.readdir(categoryPath)
      const imageFiles = templateFiles.filter(file => 
        /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
      )
      
      const previewCategoryPath = path.join(PREVIEWS_DIR, category)
      
      let existingPreviews: string[] = []
      try {
        existingPreviews = await fs.readdir(previewCategoryPath)
      } catch (error) {
        console.log(`  ⚠️  Preview folder doesn't exist: ${category}`)
        await fs.mkdir(previewCategoryPath, { recursive: true })
      }
      
      for (const templateFile of imageFiles) {
        const previewName = getPreviewName(templateFile)
        
        if (!existingPreviews.includes(previewName)) {
          const missing = {
            category,
            templatePath: path.join(categoryPath, templateFile),
            templateName: templateFile,
            previewPath: path.join(previewCategoryPath, previewName),
            previewName
          }
          missingPreviews.push(missing)
          console.log(`  ❌ Missing preview: ${templateFile} → ${previewName}`)
        } else {
          console.log(`  ✅ Preview exists: ${previewName}`)
        }
      }
    }
    
    return missingPreviews
  } catch (error) {
    console.error('Error scanning for missing previews:', error)
    throw error
  }
}

async function generatePreview(templatePath: string, referencePath: string, maxRetries: number = 3): Promise<string> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`   🔄 Retry attempt ${attempt}/${maxRetries}...`)
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt)) // 递增延迟
      }
      
      const templateBuffer = await fs.readFile(templatePath)
      const referenceBuffer = await fs.readFile(referencePath)
      
      const formData = new FormData()
      
      const templateBlob = new Blob([templateBuffer], { type: 'image/jpeg' })
      const templateFile = new File([templateBlob], 'template.jpg', { type: 'image/jpeg' })
      formData.append('image', templateFile)
      
      const referenceBlob = new Blob([referenceBuffer], { type: 'image/png' })
      const referenceFile = new File([referenceBlob], 'reference.png', { type: 'image/png' })
      formData.append('image', referenceFile)
      
      const prompt = 'Replace the pet in the first image with the pet from the second image, keeping the clothing, style, and background unchanged'
      formData.append('prompt', prompt)
      formData.append('n', '1')
      formData.append('response_format', 'url')
      formData.append('model', 'gpt-4o-image')
      formData.append('user', '')
      formData.append('size', '768x1024')
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        },
        body: formData,
        signal: AbortSignal.timeout(240000) // 240秒（4分钟）超时
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API request failed: ${response.status} - ${errorText}`)
      }
      
      const data = await response.json()
      
      if (data.data && data.data.length > 0) {
        return data.data[0].url
      } else {
        throw new Error('API returned invalid data format')
      }
    } catch (error) {
      lastError = error as Error
      console.error(`   ⚠️  Attempt ${attempt} failed:`, error instanceof Error ? error.message : 'Unknown error')
      
      if (attempt === maxRetries) {
        throw lastError
      }
    }
  }
  
  throw lastError || new Error('Failed after all retries')
}

async function downloadAndSaveImage(imageUrl: string, savePath: string): Promise<void> {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`)
    }
    
    const buffer = await response.arrayBuffer()
    await fs.writeFile(savePath, Buffer.from(buffer))
    console.log(`    💾 Saved to: ${path.basename(savePath)}`)
  } catch (error) {
    console.error('Failed to download and save image:', error)
    throw error
  }
}

async function processWithRateLimit(
  items: MissingPreview[], 
  processFunc: (item: MissingPreview) => Promise<void>,
  concurrency: number = 2,  // 恢复并发数为2
  delayMs: number = 2000     // 恢复延迟为2秒
): Promise<void> {
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency)
    
    await Promise.all(
      batch.map(item => processFunc(item))
    )
    
    if (i + concurrency < items.length) {
      console.log(`\n⏳ Waiting ${delayMs}ms before next batch...`)
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
}

async function main() {
  console.log('🎨 Pet Template Preview Generator')
  console.log('==================================')
  
  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No files will be generated\n')
  }
  
  console.log('📊 Scanning for missing previews...')
  const missingPreviews = await scanForMissingPreviews()
  
  console.log(`\n📈 Summary:`)
  console.log(`   Total missing previews: ${missingPreviews.length}`)
  
  if (missingPreviews.length === 0) {
    console.log('\n✨ All previews are up to date!')
    return
  }
  
  const categorySummary: Record<string, number> = {}
  missingPreviews.forEach(item => {
    categorySummary[item.category] = (categorySummary[item.category] || 0) + 1
  })
  
  console.log('\n   By category:')
  Object.entries(categorySummary).forEach(([category, count]) => {
    console.log(`   - ${category}: ${count} missing`)
  })
  
  if (isDryRun) {
    console.log('\n🏁 Dry run complete. No files were generated.')
    console.log('   Run without --dry-run to generate previews.')
    return
  }
  
  console.log('\n🚀 Starting preview generation...')
  console.log('   (This may take a while)\n')
  
  let successCount = 0
  let failCount = 0
  const failedItems: MissingPreview[] = []
  
  const processItem = async (item: MissingPreview) => {
    try {
      console.log(`\n🎯 Processing: ${item.category}/${item.templateName}`)
      console.log(`   Generating preview...`)
      
      const imageUrl = await generatePreview(item.templatePath, REFERENCE_IMAGE)
      
      console.log(`   ✅ Generated successfully`)
      console.log(`   Downloading image...`)
      
      await downloadAndSaveImage(imageUrl, item.previewPath)
      
      successCount++
      console.log(`   ✨ Complete: ${item.previewName}`)
    } catch (error) {
      failCount++
      failedItems.push(item)
      console.error(`   ❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  await processWithRateLimit(missingPreviews, processItem, 2, 2000)
  
  // 如果有失败的项目，尝试重新处理一次
  if (failedItems.length > 0) {
    console.log('\n' + '='.repeat(50))
    console.log('🔁 Retrying failed items...')
    console.log(`   Found ${failedItems.length} failed items to retry\n`)
    
    const retryItems = [...failedItems]
    failedItems.length = 0  // 清空失败列表
    
    for (const item of retryItems) {
      try {
        console.log(`\n🔄 Retrying: ${item.category}/${item.templateName}`)
        console.log(`   Waiting 5 seconds before retry...`)
        await new Promise(resolve => setTimeout(resolve, 5000))
        
        console.log(`   Generating preview...`)
        const imageUrl = await generatePreview(item.templatePath, REFERENCE_IMAGE)
        
        console.log(`   ✅ Generated successfully`)
        console.log(`   Downloading image...`)
        
        await downloadAndSaveImage(imageUrl, item.previewPath)
        
        successCount++
        failCount--
        console.log(`   ✨ Complete: ${item.previewName}`)
      } catch (error) {
        failedItems.push(item)  // 仍然失败的项目重新加入列表
        console.error(`   ❌ Still failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('📊 Final Report:')
  console.log(`   ✅ Successfully generated: ${successCount}`)
  console.log(`   ❌ Failed: ${failCount}`)
  
  if (failedItems.length > 0) {
    console.log('\n   Final failed items:')
    failedItems.forEach(item => {
      console.log(`   - ${item.category}/${item.templateName}`)
    })
    console.log('\n   💡 Tip: You can run the script again to retry these failed items')
  }
  
  console.log('\n✨ Preview generation complete!')
}

main().catch(error => {
  console.error('\n💥 Fatal error:', error)
  process.exit(1)
})