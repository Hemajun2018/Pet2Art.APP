import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

export const runtime = 'edge' // 使用 Edge Runtime，支持更长的执行时间

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

    // 创建流式响应
    const encoder = new TextEncoder()
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()

    // 异步处理 AI 请求
    const processAIRequest = async () => {
      try {
        // 发送开始消息
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'start', message: 'Starting generation...' })}\n\n`))

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
          await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Failed to generate image' })}\n\n`))
          await writer.close()
          return
        }

        const data = await response.json()
        
        // 发送成功消息
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'success', data: data })}\n\n`))
        await writer.close()

      } catch (error) {
        console.error("AI processing error:", error)
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Internal server error' })}\n\n`))
        await writer.close()
      }
    }

    // 启动异步处理
    processAIRequest()

    // 返回流式响应
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error("Generate pet art stream error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}