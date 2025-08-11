import { Artwork, ArtworkFavorite, ArtworkWithUser } from "@/types/artwork";
import { getIsoTimestr } from "@/lib/time";
import { getSupabaseClient } from "./db";

// 创建艺术作品记录
export async function insertArtwork(artwork: Artwork) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("artworks").insert(artwork);

  if (error) {
    throw error;
  }

  return data;
}

// 根据作品ID查找
export async function findArtworkById(
  artwork_id: string
): Promise<Artwork | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("artworks")
    .select("*")
    .eq("artwork_id", artwork_id)
    .single();

  if (error) {
    return undefined;
  }

  return data;
}

// 获取用户的所有作品
export async function getUserArtworks(
  user_uuid: string,
  page: number = 1,
  limit: number = 20
): Promise<Artwork[] | undefined> {
  if (page < 1) page = 1;
  if (limit <= 0) limit = 20;

  const offset = (page - 1) * limit;
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("artworks")
    .select("*")
    .eq("user_uuid", user_uuid)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return undefined;
  }

  return data;
}

// 获取公开展示的作品（画廊）
export async function getPublicArtworks(
  page: number = 1,
  limit: number = 20
): Promise<ArtworkWithUser[] | undefined> {
  if (page < 1) page = 1;
  if (limit <= 0) limit = 20;

  const offset = (page - 1) * limit;
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("artworks")
    .select(`
      *,
      users!inner(
        email,
        nickname,
        avatar_url
      )
    `)
    .eq("is_public", true)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return undefined;
  }

  // 格式化返回数据
  return data?.map(item => ({
    ...item,
    user_email: item.users?.email,
    user_nickname: item.users?.nickname,
    user_avatar_url: item.users?.avatar_url,
  }));
}

// 更新作品状态
export async function updateArtworkStatus(
  artwork_id: string,
  status: string,
  updates: Partial<Artwork> = {}
) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("artworks")
    .update({ status, ...updates })
    .eq("artwork_id", artwork_id);

  if (error) {
    throw error;
  }

  return data;
}

// 更新作品公开状态
export async function updateArtworkVisibility(
  artwork_id: string,
  user_uuid: string,
  is_public: boolean
) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("artworks")
    .update({ is_public })
    .eq("artwork_id", artwork_id)
    .eq("user_uuid", user_uuid);

  if (error) {
    throw error;
  }

  return data;
}

// 增加作品浏览量
export async function incrementArtworkViews(artwork_id: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("increment_artwork_views", {
    p_artwork_id: artwork_id,
  });

  if (error) {
    console.error("Error incrementing views:", error);
  }

  return data;
}

// 增加作品点赞数
export async function incrementArtworkLikes(artwork_id: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("increment_artwork_likes", {
    p_artwork_id: artwork_id,
  });

  if (error) {
    console.error("Error incrementing likes:", error);
  }

  return data;
}

// 添加收藏
export async function addFavorite(favorite: ArtworkFavorite) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("artwork_favorites")
    .insert(favorite);

  if (error) {
    throw error;
  }

  return data;
}

// 移除收藏
export async function removeFavorite(user_uuid: string, artwork_id: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("artwork_favorites")
    .delete()
    .eq("user_uuid", user_uuid)
    .eq("artwork_id", artwork_id);

  if (error) {
    throw error;
  }

  return data;
}

// 检查是否已收藏
export async function checkFavorite(
  user_uuid: string,
  artwork_id: string
): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("artwork_favorites")
    .select("id")
    .eq("user_uuid", user_uuid)
    .eq("artwork_id", artwork_id)
    .single();

  return !!data;
}

// 获取用户收藏的作品
export async function getUserFavorites(
  user_uuid: string,
  page: number = 1,
  limit: number = 20
): Promise<ArtworkWithUser[] | undefined> {
  if (page < 1) page = 1;
  if (limit <= 0) limit = 20;

  const offset = (page - 1) * limit;
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("artwork_favorites")
    .select(`
      artwork_id,
      created_at,
      artworks!inner(
        *,
        users!inner(
          email,
          nickname,
          avatar_url
        )
      )
    `)
    .eq("user_uuid", user_uuid)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return undefined;
  }

  // 格式化返回数据
  return data?.map(item => ({
    ...item.artworks,
    user_email: item.artworks.users?.email,
    user_nickname: item.artworks.users?.nickname,
    user_avatar_url: item.artworks.users?.avatar_url,
    is_favorited: true,
  }));
}

// 获取作品统计数据
export async function getArtworkStats(user_uuid?: string) {
  const supabase = getSupabaseClient();
  
  let query = supabase
    .from("artworks")
    .select("status, credits_used", { count: "exact" });

  if (user_uuid) {
    query = query.eq("user_uuid", user_uuid);
  }

  const { data, count, error } = await query;

  if (error) {
    return null;
  }

  const stats = {
    total: count || 0,
    completed: 0,
    failed: 0,
    total_credits_used: 0,
  };

  data?.forEach(item => {
    if (item.status === "completed") {
      stats.completed++;
      stats.total_credits_used += item.credits_used || 0;
    } else if (item.status === "failed") {
      stats.failed++;
    }
  });

  return stats;
}

// 删除作品
export async function deleteArtwork(artwork_id: string, user_uuid: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("artworks")
    .delete()
    .eq("artwork_id", artwork_id)
    .eq("user_uuid", user_uuid);

  if (error) {
    throw error;
  }

  return data;
}

// 获取热门作品（根据点赞数和浏览量）
export async function getTrendingArtworks(
  limit: number = 10
): Promise<ArtworkWithUser[] | undefined> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("artworks")
    .select(`
      *,
      users!inner(
        email,
        nickname,
        avatar_url
      )
    `)
    .eq("is_public", true)
    .eq("status", "completed")
    .order("likes", { ascending: false })
    .order("views", { ascending: false })
    .limit(limit);

  if (error) {
    return undefined;
  }

  // 格式化返回数据
  return data?.map(item => ({
    ...item,
    user_email: item.users?.email,
    user_nickname: item.users?.nickname,
    user_avatar_url: item.users?.avatar_url,
  }));
}