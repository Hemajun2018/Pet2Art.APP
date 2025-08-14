import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sendEmail, generateArtworkCompleteEmailHTML } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    // 验证用户身份
    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { success: false, message: "未登录或邮箱信息不完整" },
        { status: 401 }
      );
    }

    const webUrl = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';
    
    // 生成测试邮件内容
    const emailData = {
      to: session.user.email,
      subject: '🧪 Pet2Art 邮件服务测试',
      html: generateArtworkCompleteEmailHTML({
        userName: session.user.name || '测试用户',
        artworkUrl: `${webUrl}/templates/cute/cute-superhero-cat.jpg`,
        templateName: '超级英雄猫咪（测试）',
        generationTime: 125000, // 2分钟5秒
        webUrl,
      }),
    };

    // 发送测试邮件
    const result = await sendEmail(emailData);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `测试邮件已发送到 ${session.user.email}`,
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.message || '邮件发送失败',
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      { success: false, message: error.message || "测试邮件发送失败" },
      { status: 500 }
    );
  }
}