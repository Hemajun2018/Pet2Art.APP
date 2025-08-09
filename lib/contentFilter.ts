/**
 * Content filtering and moderation utilities
 * Helps ensure compliance with Lemonsqueezy terms by filtering inappropriate content
 */

// Prohibited content keywords for pet art generation
const PROHIBITED_KEYWORDS = [
  // Violence
  'blood', 'gore', 'violence', 'weapon', 'gun', 'knife', 'dead', 'death', 'kill',
  // Adult content  
  'nude', 'naked', 'sexual', 'erotic', 'porn', 'xxx',
  // Drugs
  'drug', 'cocaine', 'marijuana', 'weed',
  // Hate speech
  'hate', 'racist', 'nazi',
  // Gambling
  'casino', 'gambling', 'bet', 'lottery',
  // Other prohibited
  'human', 'person', 'people', 'child', 'kid', 'baby'
]

/**
 * Check if prompt contains prohibited content
 */
export function checkProhibitedContent(prompt: string): { 
  isValid: boolean
  reason?: string 
} {
  const lowerPrompt = prompt.toLowerCase()
  
  for (const keyword of PROHIBITED_KEYWORDS) {
    if (lowerPrompt.includes(keyword)) {
      return {
        isValid: false,
        reason: `Content contains prohibited terms. Please ensure your prompt is appropriate for pet art generation.`
      }
    }
  }
  
  return { isValid: true }
}

/**
 * Validate uploaded image file
 */
export function validateImageFile(file: File): {
  isValid: boolean
  reason?: string
} {
  // Check file type
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
  if (!validTypes.includes(file.type)) {
    return {
      isValid: false,
      reason: 'Please upload a valid image file (JPEG, PNG, or WebP)'
    }
  }
  
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      reason: 'Image size must be less than 10MB'
    }
  }
  
  // Check file name for suspicious patterns
  const fileName = file.name.toLowerCase()
  for (const keyword of PROHIBITED_KEYWORDS) {
    if (fileName.includes(keyword)) {
      return {
        isValid: false,
        reason: 'File name contains inappropriate content'
      }
    }
  }
  
  return { isValid: true }
}

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Check if content is appropriate for all ages (13+)
 */
export function isAgeAppropriate(content: string): boolean {
  const inappropriateTerms = [
    'alcohol', 'beer', 'wine', 'vodka', 'whiskey',
    'cigarette', 'smoking', 'tobacco',
    'violence', 'gore', 'blood'
  ]
  
  const lowerContent = content.toLowerCase()
  return !inappropriateTerms.some(term => lowerContent.includes(term))
}