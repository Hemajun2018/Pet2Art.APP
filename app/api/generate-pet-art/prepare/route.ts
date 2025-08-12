import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { v4 as uuidv4 } from "uuid";
import { getIsoTimestr } from "@/lib/time";
import { insertArtwork } from "@/models/artwork";

// 这个 API 只负责验证用户、检查积分、扣除积分、创建初始记录
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

    // 确保用户ID存在
    if (!session.user.id) {
      return NextResponse.json(
        { success: false, message: "User ID not found in session" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { templateId, templateName, templateCategory, aspectRatio } = body;

    if (!templateId) {
      return NextResponse.json(
        { success: false, message: "Template ID is required" },
        { status: 400 }
      );
    }

    // 检查用户积分
    const user_uuid = session.user.id;
    
    const { getUserCredits } = await import("@/services/credit");
    const creditsResult = await getUserCredits(user_uuid);
    const userCredits = creditsResult.left_credits || 0;

    if (userCredits < 1) {
      return NextResponse.json(
        { success: false, message: "Insufficient credits" },
        { status: 402 }
      );
    }

    // 生成作品ID
    const artwork_id = `art_${uuidv4()}`;

    // 创建初始作品记录（状态为 processing）
    const artwork = {
      artwork_id,
      user_uuid,
      template_id: templateId,
      template_name: templateName || '',
      template_category: templateCategory || '',
      generated_image_url: '',
      original_image_url: '',
      prompt: '',
      custom_requirements: '',
      aspect_ratio: aspectRatio || 'Auto',
      status: 'processing' as const,
      credits_used: 1,
      generation_time: 0,
      model_used: 'gpt-4o-image',
      is_public: false,
      created_at: getIsoTimestr(),
    };

    await insertArtwork(artwork);

    // 扣除积分
    const { decreaseCredits, CreditsTransType } = await import("@/services/credit");
    await decreaseCredits({
      user_uuid,
      trans_type: CreditsTransType.Ping,
      credits: 1,
    });

    // 返回作品ID和剩余积分，前端将使用这些信息
    return NextResponse.json({
      success: true,
      data: {
        artwork_id,
        user_uuid,
        remaining_credits: userCredits - 1,
      },
    });

  } catch (error: any) {
    console.error("Error preparing generation:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to prepare generation" },
      { status: 500 }
    );
  }
}