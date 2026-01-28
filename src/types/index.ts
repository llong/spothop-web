export interface UserProfile {
    id: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
    city: string | null;
    country: string | null;
    riderType: string | null;
    bio: string | null;
    instagramHandle: string | null;
    followerCount?: number;
    followingCount?: number;
    role?: 'admin' | 'moderator' | 'user';
    isBanned?: boolean;
}

export interface Spot {
    id: string;
    name: string;
    description: string;
    created_by?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    is_lit?: boolean;
    kickout_risk?: number;
    latitude: number;
    longitude: number;
    location?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    created_at?: string;
    updated_at?: string;
    types?: string[];
    spot_type?: string[];
    postalCode?: string;
    videoUrl?: string;
    photoUrl?: string;
    favoriteCount?: number;
    flagCount?: number;
    isFavorited?: boolean;
    favoritedBy?: string[];
    thumbnail_small_url?: string;
    thumbnail_large_url?: string;
}

export interface VideoAsset {
    id: string;
    file: File;
    thumbnail?: File;
}

export interface SpotFilters {
    difficulty?: string;
    kickout_risk?: number; // Filter for <= risk
    is_lit?: boolean;
    spot_type?: string[];
}

export type SpotFlagReason =
    | 'inappropriate_content'
    | 'incorrect_information'
    | 'spot_no_longer_exists'
    | 'duplicate_spot'
    | 'other';

export const SPOT_FLAG_REASONS: Record<SpotFlagReason, string> = {
    inappropriate_content: 'Inappropriate Content',
    incorrect_information: 'Incorrect Information',
    spot_no_longer_exists: 'Spot No Longer Exists',
    duplicate_spot: 'Duplicate Spot',
    other: 'Other',
};

export interface ContentReport {
    id: string;
    user_id: string;
    target_id: string;
    target_type: 'spot' | 'comment' | 'media';
    reason: string;
    details?: string;
    created_at: string;
    reporter?: {
        username: string | null;
        avatarUrl: string | null;
    };
    target_content?: any; // To store a preview of the reported content
    context_id?: string | null; // ID of the spot for context
}

export interface MediaLike {
    id: string;
    user_id: string;
    photo_id?: string;
    video_id?: string;
    media_type: 'photo' | 'video';
    created_at: string;
}

export interface MediaComment {
    id: string;
    user_id: string;
    photo_id?: string;
    video_id?: string;
    media_type: 'photo' | 'video';
    content: string;
    created_at: string;
    updated_at: string;
    author?: {
        username: string | null;
        avatarUrl: string | null;
    };
}

export interface MediaItem {
    id: string;
    url: string;
    thumbnailUrl?: string;
    type: 'photo' | 'video';
    createdAt: string;
    author: {
        id: string;
        username: string | null;
        avatarUrl: string | null;
    };
    likeCount: number;
    isLiked: boolean;
}

export interface FeedItem {
    media_id: string;
    spot_id: string;
    uploader_id: string;
    media_url: string;
    thumbnail_url?: string;
    media_type: 'photo' | 'video';
    created_at: string;
    spot_name: string;
    city?: string;
    country?: string;
    uploader_username: string | null;
    uploader_avatar_url: string | null;
    like_count: number;
    comment_count: number;
    popularity_score: number;
    is_liked_by_user?: boolean;
    is_favorited_by_user?: boolean;
}

export interface LikedMediaItem {
    id: string;
    mediaId: string;
    url: string;
    thumbnailUrl?: string;
    type: 'photo' | 'video';
    spot: {
        id: string;
        name: string;
    };
    author: {
        id: string;
        username: string | null;
        avatarUrl: string | null;
    };
}

export interface UserMediaItem {
    id: string;
    url: string;
    thumbnailUrl?: string;
    type: 'photo' | 'video';
    created_at: string;
    spot: {
        id: string;
        name: string;
        city?: string;
        country?: string;
    };
}

export type RiderType = 'inline' | 'skateboard' | 'bmx' | 'scooter';

export interface SpotComment {
    id: string;
    spot_id: string;
    user_id: string;
    parent_id: string | null;
    content: string;
    is_edited: boolean;
    created_at: string;
    updated_at: string;
    author?: {
        username: string | null;
        avatarUrl: string | null;
    };
    replies?: SpotComment[];
    reactions?: {
        likes: number;
        dislikes: number;
        userReaction: 'like' | 'dislike' | null;
    };
}

export interface AppNotification {
    id: string;
    user_id: string;
    actor_id: string;
    type: 'reply' | 'like_spot' | 'like_media';
    entity_id: string;
    entity_type: 'comment' | 'spot' | 'media';
    is_read: boolean;
    created_at: string;
    actor?: {
        username: string | null;
        avatarUrl: string | null;
    };
}
