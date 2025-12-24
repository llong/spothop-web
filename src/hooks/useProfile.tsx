import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { userAtom, profileAtom } from "../atoms/auth";
import supabase from "../supabase";
import type { UserProfile, Spot } from "../types";

export const useProfile = () => {
    const [user] = useAtom(userAtom);
    const [profile, setProfile] = useAtom(profileAtom);
    const [favoriteSpots, setFavoriteSpots] = useState<Spot[]>([]);

    useEffect(() => {
        if (user) {
            getProfile();
            getFavoriteSpots();
        }
    }, [user]);

    const getProfile = async () => {
        try {
            if (!user) throw new Error("No user on the session!");

            const [profileResult, followersResult, followingResult] = await Promise.all([
                supabase
                    .from("profiles")
                    .select(`username, "avatarUrl", city, country, "riderType", bio, "instagramHandle"`)
                    .eq("id", user.user.id)
                    .single(),
                supabase
                    .from("user_followers")
                    .select("*", { count: 'exact', head: true })
                    .eq("following_id", user.user.id),
                supabase
                    .from("user_followers")
                    .select("*", { count: 'exact', head: true })
                    .eq("follower_id", user.user.id)
            ]);

            if (profileResult.error && profileResult.status !== 406) {
                throw profileResult.error;
            }

            if (profileResult.data) {
                setProfile({
                    ...profileResult.data,
                    followerCount: followersResult.count || 0,
                    followingCount: followingResult.count || 0
                } as UserProfile);
            }
        } catch (error) {
            if (error instanceof Error) {
                alert(error.message);
            }
        }
    };

    const getFavoriteSpots = async () => {
        try {
            if (!user) return;

            const { data, error } = await supabase
                .from('user_favorite_spots')
                .select(`
                    spots (
                        *,
                        spot_photos (url)
                    )
                `)
                .eq('user_id', user.user.id);

            if (error) throw error;

            if (data) {
                const spots = data.map((item: any) => {
                    const spot = item.spots;
                    if (!spot) return null;

                    // Choose a random photo as thumbnail
                    let thumbnailUrl = null;
                    if (spot.spot_photos && spot.spot_photos.length > 0) {
                        const randomIndex = Math.floor(Math.random() * spot.spot_photos.length);
                        thumbnailUrl = spot.spot_photos[randomIndex].url;
                    }

                    return {
                        ...spot,
                        photoUrl: thumbnailUrl
                    };
                }).filter(Boolean) as Spot[];

                setFavoriteSpots(spots);
            }
        } catch (error) {
            console.error("Error fetching favorite spots:", error);
        }
    };

    const updateProfile = async (updates: Partial<UserProfile>) => {
        try {
            if (!user) throw new Error("No user on the session!");

            const profileUpdates = {
                ...updates,
                id: user.user.id,
                "updatedAt": new Date(),
            };

            const { error } = await supabase.from("profiles").upsert(profileUpdates);

            if (error) {
                throw error;
            }
            setProfile(profileUpdates as UserProfile);
        } catch (error) {
            if (error instanceof Error) {
                alert(error.message);
            }
        }
    };

    return { profile, favoriteSpots, updateProfile, getProfile, getFavoriteSpots };
};
