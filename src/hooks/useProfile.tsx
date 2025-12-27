import { useEffect, useState, useCallback } from "react";
import { useAtom } from "jotai";
import { userAtom, profileAtom } from "../atoms/auth";
import supabase from "../supabase";
import type { UserProfile, Spot, LikedMediaItem, UserMediaItem } from "../types";
import { reverseGeocode } from "../utils/geocoding";

export const useProfile = (userId?: string) => {
    const [user] = useAtom(userAtom);
    const [profile, setProfile] = useAtom(profileAtom);
    const [favoriteSpots, setFavoriteSpots] = useState<Spot[]>([]);
    const [likedMedia, setLikedMedia] = useState<LikedMediaItem[]>([]);
    const [loadingMedia, setLoadingMedia] = useState(false);

    // User Content Stats
    const [createdSpots, setCreatedSpots] = useState<Spot[]>([]);
    const [userMedia, setUserMedia] = useState<UserMediaItem[]>([]);
    const [loadingContent, setLoadingContent] = useState(false);

    const targetUserId = userId || user?.user.id;

    useEffect(() => {
        if (targetUserId) {
            getProfile();
            getFavoriteSpots();
            getLikedMedia();
            getUserContent();
        }
    }, [targetUserId, user]);

    const getProfile = async () => {
        try {
            if (!targetUserId) return;

            const [profileResult, followersResult, followingResult] = await Promise.all([
                supabase
                    .from("profiles")
                    .select(`username, "avatarUrl", city, country, "riderType", bio, "instagramHandle"`)
                    .eq("id", targetUserId)
                    .single(),
                supabase
                    .from("user_followers")
                    .select("*", { count: 'exact', head: true })
                    .eq("following_id", targetUserId),
                supabase
                    .from("user_followers")
                    .select("*", { count: 'exact', head: true })
                    .eq("follower_id", targetUserId)
            ]);

            if (profileResult.error && profileResult.status !== 406) {
                throw profileResult.error;
            }

            if (profileResult.data) {
                // Only update global profile atom if it's the current user's profile
                const isOwnProfile = targetUserId === user?.user.id;
                const formattedProfile = {
                    ...profileResult.data,
                    followerCount: followersResult.count || 0,
                    followingCount: followingResult.count || 0
                } as UserProfile;

                if (isOwnProfile) {
                    setProfile(formattedProfile);
                }
                return formattedProfile;
            }
        } catch (error) {
            if (error instanceof Error) {
                alert(error.message);
            }
        }
    };

    const getFavoriteSpots = async () => {
        try {
            if (!targetUserId) return;

            const { data, error } = await supabase
                .from('user_favorite_spots')
                .select(`
                    spots (
                        *,
                        spot_photos (url)
                    )
                `)
                .eq('user_id', targetUserId);

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

    const getUserContent = useCallback(async () => {
        if (!targetUserId) return;
        setLoadingContent(true);
        try {
            // 1. Fetch Created Spots
            const { data: spots, error: spotsError } = await supabase
                .from('spots')
                .select('id, name, description, latitude, longitude, address, city, country, created_at, difficulty, kickout_risk, spot_type, spot_photos(url)')
                .eq('created_by', targetUserId)
                .order('created_at', { ascending: false });

            if (spotsError) throw spotsError;

            const formattedSpots = await Promise.all(spots.map(async (spot: any) => {
                let city = spot.city;
                let state = spot.state;
                let country = spot.country;

                if (!city || !state || !country) {
                    const info = await reverseGeocode(spot.latitude, spot.longitude);
                    city = city || info.city;
                    state = state || info.state;
                    country = country || info.country;
                }

                return {
                    ...spot,
                    city,
                    state,
                    country,
                    photoUrl: spot.spot_photos?.[0]?.url || null
                };
            })) as Spot[];
            setCreatedSpots(formattedSpots);

            // 2. Fetch User Media (Photos & Videos)
            const [photosResult, videosResult] = await Promise.all([
                supabase
                    .from('spot_photos')
                    .select('id, url, created_at, spots(id, name, city, country, latitude, longitude)')
                    .eq('user_id', targetUserId)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('spot_videos')
                    .select('id, url, thumbnail_url, created_at, spots(id, name, city, country, latitude, longitude)')
                    .eq('user_id', targetUserId)
                    .order('created_at', { ascending: false })
            ]);

            if (photosResult.error) throw photosResult.error;
            if (videosResult.error) throw videosResult.error;

            const photosWithFallback = await Promise.all((photosResult.data || []).map(async (p: any) => {
                let city = p.spots?.city;
                let state = p.spots?.state;
                let country = p.spots?.country;
                if (p.spots && (!city || !state || !country)) {
                    const info = await reverseGeocode(p.spots.latitude, p.spots.longitude);
                    city = city || info.city;
                    state = state || info.state;
                    country = country || info.country;
                }
                return {
                    id: p.id,
                    url: p.url,
                    type: 'photo' as const,
                    created_at: p.created_at,
                    spot: {
                        id: p.spots?.id,
                        name: p.spots?.name,
                        city: city || 'Unknown City',
                        state,
                        country: country || 'Unknown Country'
                    }
                };
            }));

            const videosWithFallback = await Promise.all((videosResult.data || []).map(async (v: any) => {
                let city = v.spots?.city;
                let state = v.spots?.state;
                let country = v.spots?.country;
                if (v.spots && (!city || !state || !country)) {
                    const info = await reverseGeocode(v.spots.latitude, v.spots.longitude);
                    city = city || info.city;
                    state = state || info.state;
                    country = country || info.country;
                }
                return {
                    id: v.id,
                    url: v.url,
                    thumbnailUrl: v.thumbnail_url,
                    type: 'video' as const,
                    created_at: v.created_at,
                    spot: {
                        id: v.spots?.id,
                        name: v.spots?.name,
                        city: city || 'Unknown City',
                        state,
                        country: country || 'Unknown Country'
                    }
                };
            }));

            const allMedia: UserMediaItem[] = [...photosWithFallback, ...videosWithFallback]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            setUserMedia(allMedia);

        } catch (error) {
            console.error("Error fetching user content:", error);
        } finally {
            setLoadingContent(false);
        }
    }, [targetUserId]);

    const getLikedMedia = async () => {
        try {
            if (!targetUserId) return;
            setLoadingMedia(true);

            // 1. Fetch liked media records
            const { data: likes, error: likesError } = await supabase
                .from('media_likes')
                .select('*')
                .eq('user_id', targetUserId)
                .order('created_at', { ascending: false });

            if (likesError) throw likesError;
            if (!likes || likes.length === 0) {
                setLikedMedia([]);
                return;
            }

            // 2. Fetch photos and videos details
            const photoIds = likes.filter(l => l.media_type === 'photo').map(l => l.photo_id);
            const videoIds = likes.filter(l => l.media_type === 'video').map(l => l.video_id);

            const [photosResult, videosResult] = await Promise.all([
                photoIds.length > 0
                    ? supabase.from('spot_photos').select('*, spot:spots(id, name, city, country, latitude, longitude)').in('id', photoIds)
                    : Promise.resolve({ data: [], error: null }),
                videoIds.length > 0
                    ? supabase.from('spot_videos').select('*, spot:spots(id, name, city, country, latitude, longitude)').in('id', videoIds)
                    : Promise.resolve({ data: [], error: null })
            ]);

            if (photosResult.error) throw photosResult.error;
            if (videosResult.error) throw videosResult.error;

            // 3. Fetch all unique authors profiles
            const authorIds = [
                ...(photosResult.data || []).map((p: any) => p.user_id),
                ...(videosResult.data || []).map((v: any) => v.user_id)
            ].filter((v, i, a) => v && a.indexOf(v) === i);

            const { data: profiles, error: profilesError } = authorIds.length > 0
                ? await supabase.from('profiles').select('id, username, avatarUrl').in('id', authorIds)
                : { data: [], error: null };

            if (profilesError) throw profilesError;

            const profileMap = (profiles || []).reduce((acc: any, p: any) => {
                acc[p.id] = p;
                return acc;
            }, {});

            // 4. Format the final results
            const formattedMedia = await Promise.all(likes.map(async (like) => {
                const mediaData = like.media_type === 'photo'
                    ? photosResult.data?.find((p: any) => p.id === like.photo_id)
                    : videosResult.data?.find((v: any) => v.id === like.video_id);

                if (!mediaData) return null;

                const authorProfile = profileMap[mediaData.user_id];

                let city = mediaData.spot?.city;
                let state = mediaData.spot?.state;
                let country = mediaData.spot?.country;

                if (mediaData.spot && (!city || !state || !country)) {
                    if (mediaData.spot.latitude && mediaData.spot.longitude) {
                        const info = await reverseGeocode(mediaData.spot.latitude, mediaData.spot.longitude);
                        city = city || info.city;
                        state = state || info.state;
                        country = country || info.country;
                    }
                }

                return {
                    id: like.id,
                    mediaId: mediaData.id,
                    url: mediaData.url,
                    thumbnailUrl: like.media_type === 'video' ? mediaData.thumbnail_url : undefined,
                    type: like.media_type,
                    spot: {
                        id: mediaData.spot?.id,
                        name: mediaData.spot?.name,
                        city,
                        state,
                        country
                    },
                    author: {
                        id: mediaData.user_id,
                        username: authorProfile?.username || 'Unknown',
                        avatarUrl: authorProfile?.avatarUrl || null
                    }
                };
            }));

            setLikedMedia(formattedMedia.filter(Boolean) as LikedMediaItem[]);
        } catch (error) {
            console.error("Error fetching liked media:", error);
        } finally {
            setLoadingMedia(false);
        }
    };

    return {
        profile,
        favoriteSpots,
        likedMedia,
        loadingMedia,
        createdSpots,
        userMedia,
        loadingContent,
        updateProfile,
        getProfile,
        getFavoriteSpots,
        getLikedMedia,
        getUserContent
    };
};
