import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateArtworkVisibility } from "@/models/artwork";

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
    const { artwork_id, is_public } = body;

    if (!artwork_id || typeof is_public !== "boolean") {
      return NextResponse.json(
        { success: false, message: "Invalid parameters" },
        { status: 400 }
      );
    }

    const user_uuid = session.user.id;

    // 更新作品的公开状态（只能更新自己的作品）
    await updateArtworkVisibility(artwork_id, user_uuid, is_public);

    return NextResponse.json({
      success: true,
      message: is_public ? "Artwork is now public" : "Artwork is now private",
      is_public,
    });
  } catch (error) {
    console.error("Error updating artwork visibility:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update artwork visibility" },
      { status: 500 }
    );
  }
}