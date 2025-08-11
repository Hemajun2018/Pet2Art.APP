export interface Artwork {
  id?: number;
  artwork_id: string;
  user_uuid: string;
  created_at?: string;
  template_id: string;
  template_name?: string;
  generated_image_url: string;
  original_image_url?: string;
  prompt?: string;
  custom_requirements?: string;
  aspect_ratio?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  credits_used: number;
  generation_time?: number;
  is_public?: boolean;
  likes?: number;
  views?: number;
  error_message?: string;
}

export interface ArtworkFavorite {
  id?: number;
  user_uuid: string;
  artwork_id: string;
  created_at?: string;
}

export interface ArtworkWithUser extends Artwork {
  user_email?: string;
  user_nickname?: string;
  user_avatar_url?: string;
  is_favorited?: boolean;
}