import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { insertArtwork, updateArtworkStatus } from "@/models/artwork";
import { insertCredit } from "@/models/credit";
import { v4 as uuidv4 } from "uuid";
import { getIsoTimestr } from "@/lib/time";

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
      template_id,
      template_name,
      template_category,
      generated_image_url,
      original_image_url,
      prompt,
      custom_requirements,
      aspect_ratio,
      credits_used = 1,
      generation_time,
      model_used,
      is_public = false,
    } = body;

    // 验证必要字段
    if (!template_id || !generated_image_url) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // 生成唯一的作品ID
    const artwork_id = `art_${uuidv4()}`;
    const user_uuid = session.user.id;

    // 保存作品记录
    const artwork = {
      artwork_id,
      user_uuid,
      template_id,
      template_name,
      template_category,
      generated_image_url,
      original_image_url,
      prompt,
      custom_requirements,
      aspect_ratio: aspect_ratio || "3:4",
      status: "completed" as const,
      credits_used,
      generation_time,
      model_used,
      is_public,
      created_at: getIsoTimestr(),
    };

    await insertArtwork(artwork);

    // 记录积分消耗
    if (credits_used > 0) {
      const creditRecord = {
        trans_no: `deduct_${uuidv4()}`,
        user_uuid,
        trans_type: "deduct",
        credits: credits_used,
        description: `Generated artwork: ${template_name || template_id}`,
        created_at: getIsoTimestr(),
      };
      
      await insertCredit(creditRecord);
    }

    return NextResponse.json({
      success: true,
      data: {
        artwork_id,
        generated_image_url,
        credits_used,
      },
    });
  } catch (error) {
    console.error("Error saving artwork:", error);
    return NextResponse.json(
      { success: false, message: "Failed to save artwork" },
      { status: 500 }
    );
  }
}