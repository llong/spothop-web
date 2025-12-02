export interface UserProfile {
    username: string | null;
    avatarUrl: string | null;
    city: string | null;
    country: string | null;
    riderType: string | null;
    bio: string | null;
    instagramHandle: string | null;
}

export interface Spot {
    id: number;
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
}
