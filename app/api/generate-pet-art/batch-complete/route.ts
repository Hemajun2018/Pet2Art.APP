import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sendEmail, generateBatchArtworkCompleteEmailHTML } from "@/lib/email";

// 批量生成完成后的统一处理API
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
      artworks, // Array of { artwork_id, url, templateName }
      totalGenerationTime
    } = body;

    if (!artworks || !Array.isArray(artworks) || artworks.length === 0) {
      return NextResponse.json(
        { success: false, message: "No artworks provided" },
        { status: 400 }
      );
    }

    // 发送批量完成通知邮件
    if (session.user.email) {
      console.log('📧 准备发送批量生图完成通知邮件...');
      console.log('用户邮箱:', session.user.email);
      console.log('用户名称:', session.user.name);
      console.log('生成数量:', artworks.length);
      
      const webUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://pet2art.app';
      
      // 处理模板名称，去除宠物品种部分
      const processedArtworks = artworks.map(artwork => {
        let styleName = artwork.templateName || 'Pet Artwork';
        if (styleName.includes(' — ')) {
          styleName = styleName.split(' — ')[0];
        }
        return {
          url: artwork.url,
          templateName: styleName
        };
      });
      
      const emailData = {
        to: session.user.email,
        subject: `🎉 Your ${artworks.length} Pet Artworks are Ready!`,
        html: generateBatchArtworkCompleteEmailHTML({
          userName: session.user.name || 'User',
          artworks: processedArtworks,
          totalGenerationTime: totalGenerationTime || 0,
          webUrl,
        }),
      };
      
      // 异步发送邮件，不等待结果
      sendEmail(emailData)
        .then((result) => {
          if (result.success) {
            console.log('✅ 批量生图完成邮件发送成功:', result.messageId);
          } else {
            console.error('❌ 批量生图完成邮件发送失败:', result.message);
          }
        })
        .catch((error) => {
          console.error('❌ 发送批量生图完成邮件时出错:', error);
        });
    } else {
      console.log('⚠️ 用户没有邮箱，跳过邮件发送');
    }

    return NextResponse.json({
      success: true,
      message: `Batch completion notification sent for ${artworks.length} artworks`
    });

  } catch (error: any) {
    console.error("Error processing batch completion:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process batch completion" },
      { status: 500 }
    );
  }
}