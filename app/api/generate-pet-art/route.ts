import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { insertArtwork } from "@/models/artwork";
import { insertCredit } from "@/models/credit";
import { findUserByUuid } from "@/models/user";
import { v4 as uuidv4 } from "uuid";
import { getIsoTimestr } from "@/lib/time";

interface ApiResponse {
  data: Array<{
    url: string
    revised_prompt: string
  }>
  created: number
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
    input_tokens: number
    output_tokens: number
  }
}

// 从环境变量获取API配置（注意：后端使用不带NEXT_PUBLIC前缀的环境变量）
const API_KEY = process.env.PET_AI_API_KEY || process.env.NEXT_PUBLIC_PET_AI_API_KEY || ''
const API_URL = process.env.PET_AI_API_URL || process.env.NEXT_PUBLIC_PET_AI_API_URL || 'https://api.apicore.ai/v1/images/edits'

export async function POST(req: NextRequest) {
  try {
    // 验证用户身份
    const session = await auth();
    console.log('Session:', session);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // 确保用户ID存在
    if (!session.user.id) {
      console.error('User ID is missing from session:', session.user);
      return NextResponse.json(
        { success: false, message: "User ID not found in session" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const petImage = formData.get('petImage') as File;
    const templateImageUrl = formData.get('templateImageUrl') as string;
    const customPrompt = formData.get('customPrompt') as string;
    const aspectRatio = formData.get('aspectRatio') as string;
    const templateId = formData.get('templateId') as string;
    const templateName = formData.get('templateName') as string;
    const templateCategory = formData.get('templateCategory') as string;

    if (!petImage || !templateImageUrl || !templateId) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // 检查用户积分
    const user_uuid = session.user.id;
    console.log('User UUID:', user_uuid);
    const userCreditsResp = await fetch(`${process.env.NEXT_PUBLIC_WEB_URL}/api/get-user-credits`, {
      method: "POST",
      headers: {
        'Cookie': req.headers.get('cookie') || '',
      },
    });
    
    const creditsData = await userCreditsResp.json();
    const userCredits = creditsData.data?.left_credits || 0;

    if (userCredits < 1) {
      return NextResponse.json(
        { success: false, message: "Insufficient credits" },
        { status: 402 }
      );
    }

    // 准备调用AI API
    const aiFormData = new FormData();
    
    // 获取模板图片 - 构建完整的URL
    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';
    const fullTemplateUrl = templateImageUrl.startsWith('http') 
      ? templateImageUrl 
      : `${baseUrl}${templateImageUrl}`;
    
    const templateResponse = await fetch(fullTemplateUrl);
    if (!templateResponse.ok) {
      console.error(`Failed to fetch template image: ${templateResponse.status}`);
      return NextResponse.json(
        { success: false, message: "Failed to fetch template image" },
        { status: 500 }
      );
    }
    
    const templateBlob = await templateResponse.blob();
    const templateFile = new File([templateBlob], 'template.jpg', { type: 'image/jpeg' });
    aiFormData.append('image', templateFile);
    
    // 添加用户宠物照片
    aiFormData.append('image', petImage);
    
    // 构建提示词
    const basePrompt = 'Replace the pet in the first image with the pet from the second image, keeping the clothing, style, and background unchanged';
    const prompt = customPrompt ? `${basePrompt}. ${customPrompt}` : basePrompt;
    aiFormData.append('prompt', prompt);
    
    // 其他参数
    aiFormData.append('n', '1');
    aiFormData.append('response_format', 'url');
    aiFormData.append('model', 'gpt-4o-image');
    aiFormData.append('user', user_uuid);
    
    // 设置图片尺寸
    const sizeMap: Record<string, string> = {
      'Auto': '768x1024',
      '1:1': '1024x1024',
      '4:3': '1024x768',
      '3:4': '768x1024',
      '16:9': '1024x576',
      '9:16': '576x1024'
    };
    
    const size = sizeMap[aspectRatio] || sizeMap['Auto'];
    aiFormData.append('size', size);

    // 记录开始时间
    const startTime = Date.now();

    // 调用AI API（设置5分钟超时，因为生成图片需要2-3分钟）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5分钟超时
    
    const aiResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      },
      body: aiFormData,
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`AI API error: ${errorText}`);
      return NextResponse.json(
        { success: false, message: "Failed to generate image" },
        { status: 500 }
      );
    }

    const aiData: ApiResponse = await aiResponse.json();
    
    if (!aiData.data || aiData.data.length === 0) {
      return NextResponse.json(
        { success: false, message: "No image generated" },
        { status: 500 }
      );
    }

    const generatedImageUrl = aiData.data[0].url;
    const generationTime = Date.now() - startTime;

    // 保存原始宠物图片（可选，这里暂时跳过）
    let originalImageUrl = '';

    // 生成作品ID
    const artwork_id = `art_${uuidv4()}`;

    // 保存作品记录
    const artwork = {
      artwork_id,
      user_uuid,
      template_id: templateId,
      template_name: templateName,
      template_category: templateCategory,
      generated_image_url: generatedImageUrl,
      original_image_url: originalImageUrl,
      prompt: prompt,
      custom_requirements: customPrompt || '',
      aspect_ratio: aspectRatio || 'Auto',
      status: 'completed' as const,
      credits_used: 1,
      generation_time: generationTime,
      model_used: 'gpt-4o-image',
      is_public: false,
      created_at: getIsoTimestr(),
    };

    await insertArtwork(artwork);

    // 扣除积分
    const creditRecord: any = {
      trans_no: `deduct_${uuidv4()}`,
      user_uuid,
      trans_type: "deduct",
      credits: -1,  // 扣除积分应该是负数
      description: `Generated artwork: ${templateName || templateId}`,
      order_no: null,  // 使用 null 而不是空字符串
      expired_at: null,  // 使用 null 而不是空字符串
      created_at: getIsoTimestr(),
    };
    
    await insertCredit(creditRecord);

    return NextResponse.json({
      success: true,
      data: {
        artwork_id,
        generated_image_url: generatedImageUrl,
        credits_used: 1,
        remaining_credits: userCredits - 1,
      },
    });
  } catch (error: any) {
    console.error("Error generating pet art:", error);
    
    // 处理超时错误
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { success: false, message: "Request timeout. Please try again with a simpler prompt or smaller image." },
        { status: 408 }
      );
    }
    
    // 处理其他错误
    return NextResponse.json(
      { success: false, message: error.message || "Failed to generate pet art" },
      { status: 500 }
    );
  }
}