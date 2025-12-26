export interface UserProfile {
    id: string;
    username: string | null;
    avatarUrl: string | null;
    city: string | null;
    country: string | null;
    riderType: string | null;
    bio: string | null;
    instagramHandle: string | null;
    followerCount?: number;
    followingCount?: number;
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
    country?: string;
    created_at?: string;
    updated_at?: string;
    types?: string[];
    spot_type?: string[];
    postalCode?: string;
    videoUrl?: string;
    photoUrl?: string;
    favoriteCount?: number;
    favoritedBy?: string[];
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

export interface SpotFlag {
    id: string;
    spot_id: string;
    user_id: string;
    reason: SpotFlagReason;
    details?: string;
    created_at: string;
}
