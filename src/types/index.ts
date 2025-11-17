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
    latitude: number;
    longitude: number;
    name: string;
    description: string;
}
