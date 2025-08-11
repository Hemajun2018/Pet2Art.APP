import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { addFavorite, removeFavorite, checkFavorite } from "@/models/artwork";
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
    const { artwork_id } = body;

    if (!artwork_id) {
      return NextResponse.json(
        { success: false, message: "Artwork ID is required" },
        { status: 400 }
      );
    }

    const user_uuid = session.user.id;

    // 检查是否已收藏
    const isFavorited = await checkFavorite(user_uuid, artwork_id);

    if (isFavorited) {
      // 取消收藏
      await removeFavorite(user_uuid, artwork_id);
      return NextResponse.json({
        success: true,
        favorited: false,
        message: "Removed from favorites",
      });
    } else {
      // 添加收藏
      await addFavorite({
        user_uuid,
        artwork_id,
        created_at: getIsoTimestr(),
      });
      return NextResponse.json({
        success: true,
        favorited: true,
        message: "Added to favorites",
      });
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    return NextResponse.json(
      { success: false, message: "Failed to toggle favorite" },
      { status: 500 }
    );
  }
}