import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { 
  getUserArtworks, 
  getPublicArtworks, 
  getTrendingArtworks,
  getUserFavorites 
} from "@/models/artwork";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get("type") || "user"; // 'user', 'public', 'trending', 'favorites'
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const session = await auth();
    
    let data;
    
    switch (type) {
      case "user":
        // 获取当前用户的作品
        if (!session || !session.user) {
          return NextResponse.json(
            { success: false, message: "Unauthorized" },
            { status: 401 }
          );
        }
        data = await getUserArtworks(session.user.id, page, limit);
        break;
        
      case "public":
        // 获取公开的作品（画廊）
        data = await getPublicArtworks(page, limit);
        break;
        
      case "trending":
        // 获取热门作品
        data = await getTrendingArtworks(limit);
        break;
        
      case "favorites":
        // 获取用户收藏的作品
        if (!session || !session.user) {
          return NextResponse.json(
            { success: false, message: "Unauthorized" },
            { status: 401 }
          );
        }
        data = await getUserFavorites(session.user.id, page, limit);
        break;
        
      default:
        return NextResponse.json(
          { success: false, message: "Invalid type parameter" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        hasMore: data && data.length === limit,
      },
    });
  } catch (error) {
    console.error("Error fetching artworks:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch artworks" },
      { status: 500 }
    );
  }
}