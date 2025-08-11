import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getArtworkStats } from "@/models/artwork";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    // 获取查询参数
    const searchParams = req.nextUrl.searchParams;
    const user_only = searchParams.get("user_only") === "true";
    
    let stats;
    
    if (user_only) {
      // 获取当前用户的统计数据
      if (!session || !session.user) {
        return NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 }
        );
      }
      stats = await getArtworkStats(session.user.id);
    } else {
      // 获取全站统计数据（可用于管理后台）
      stats = await getArtworkStats();
    }

    if (!stats) {
      return NextResponse.json(
        { success: false, message: "Failed to get statistics" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching artwork stats:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}