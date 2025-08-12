import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateArtworkStatus } from "@/models/artwork";
import { newStorage } from "@/lib/storage";

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
      custom_requirements 
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