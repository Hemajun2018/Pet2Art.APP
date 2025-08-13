import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

export async function POST(request: NextRequest) {
  try {
    // 验证用户登录
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    // 获取请求体
    const formData = await request.formData()
    
    // 从环境变量获取 API 配置
    const API_KEY = process.env.PET_AI_API_KEY || process.env.NEXT_PUBLIC_PET_AI_API_KEY
    const API_URL = process.env.PET_AI_API_URL || process.env.NEXT_PUBLIC_PET_AI_API_URL || 'https://api.apicore.ai/v1/images/edits'

    if (!API_KEY) {
      console.error("Pet AI API key not configured")
      return NextResponse.json(
        { success: false, message: "API configuration error" },
        { status: 500 }
      )
    }

    // 转发请求到 AI API
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`AI API error: ${errorText}`)
      return NextResponse.json(
        { success: false, message: "Failed to generate image" },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      data: data
    })

  } catch (error) {
    console.error("Generate pet art proxy error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}