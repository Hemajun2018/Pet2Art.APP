import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateArtworkStatus, findArtworkById } from "@/models/artwork";
import { newStorage } from "@/lib/storage";
import { sendEmail, generateArtworkCompleteEmailHTML } from "@/lib/email";

// 这个 API 负责保存生成结果
export async function POST(req: NextRequest) {
  try {
    // 验证用户身份
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { 
      artwork_id, 
      generated_image_url, 
      generation_time,
      prompt,
      custom_requirements,
      skip_email = false // 添加跳过邮件标记，默认false
    } = body;

    if (!artwork_id || !generated_image_url) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const user_uuid = session.user.id;

    // 初始化存储
    const storage = newStorage();
    
    // 尝试上传到 R2（如果是外部URL）
    let finalImageUrl = generated_image_url;
    
    try {
      if (generated_image_url.startsWith('http')) {
        const timestamp = Date.now();
        const imageKey = `artworks/${user_uuid}/${artwork_id}/generated_${timestamp}.jpg`;
        
        const uploadResult = await storage.downloadAndUpload({
          url: generated_image_url,
          key: imageKey,
          contentType: 'image/jpeg',
        });
        
        finalImageUrl = uploadResult.url || generated_image_url;
      }
    } catch (uploadError) {
      console.error('Failed to upload to R2:', uploadError);
      // 继续使用原始 URL
    }

    // 更新作品记录
    await updateArtworkStatus(artwork_id, 'completed', {
      generated_image_url: finalImageUrl,
      generation_time: generation_time || 0,
      prompt: prompt || '',
      custom_requirements: custom_requirements || '',
    });

    // 获取作品信息用于邮件
    const artwork = await findArtworkById(artwork_id);
    
    // 发送完成通知邮件（异步，不阻塞响应）- 如果skip_email为true则跳过
    if (!skip_email && session.user.email && artwork) {
      console.log('📧 准备发送生图完成通知邮件...');
      console.log('用户邮箱:', session.user.email);
      console.log('用户名称:', session.user.name);
      console.log('图片URL:', finalImageUrl);
      console.log('模板名称:', artwork.template_name);
      
      // Extract style name from template name (remove pet breed part)
      let styleName = artwork.template_name || 'Pet Artwork';
      if (styleName.includes(' — ')) {
        styleName = styleName.split(' — ')[0]; // Get only the style part before the dash
      }
      
      const webUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://pet2art.app';
      const emailData = {
        to: session.user.email,
        subject: '🎉 Your Pet Artwork is Ready!',
        html: generateArtworkCompleteEmailHTML({
          userName: session.user.name || 'User',
          artworkUrl: finalImageUrl,
          templateName: styleName,
          generationTime: generation_time || 0,
          webUrl,
        }),
      };
      
      // 异步发送邮件，不等待结果
      sendEmail(emailData)
        .then((result) => {
          if (result.success) {
            console.log('✅ 生图完成邮件发送成功:', result.messageId);
          } else {
            console.error('❌ 生图完成邮件发送失败:', result.message);
          }
        })
        .catch((error) => {
          console.error('❌ 发送生图完成邮件时出错:', error);
        });
    } else if (skip_email) {
      console.log('⚠️ skip_email标记为true，跳过单个邮件发送（批量处理中）');
    } else {
      console.log('⚠️ 用户没有邮箱或作品信息，跳过邮件发送');
    }

    return NextResponse.json({
      success: true,
      data: {
        artwork_id,
        generated_image_url: finalImageUrl,
      },
    });

  } catch (error: any) {
    console.error("Error completing generation:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to complete generation" },
      { status: 500 }
    );
  }
}