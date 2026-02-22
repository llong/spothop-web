import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { profileService } from "@/services/profileService";
import { contestService } from "@/services/contestService";
import { spotService } from "@/services/spotService";
import { getDistance } from "@/utils/geo";
import type { Contest } from "@/types";

export function useContestSubmission(contest: Contest, open: boolean, onClose: () => void) {
    const [activeStep, setActiveStep] = useState(0);
    const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
    const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
    const [selectedMediaType, setSelectedMediaType] = useState<'photo' | 'video' | null>(null);
    const queryClient = useQueryClient();

    const { data: profile } = useQuery({
        queryKey: ['profile', 'me'],
        queryFn: async () => {
            const { data: { session } } = await (await import("@/supabase")).default.auth.getSession();
            if (!session) return null;
            return profileService.fetchIdentity(session.user.id);
        },
        enabled: open,
    });

    const { data: userContent, isLoading: spotsLoading } = useQuery({
        queryKey: ['user-content', profile?.id],
        queryFn: () => profileService.fetchUserContent(profile!.id),
        enabled: !!profile?.id,
    });

    const { data: favoriteSpots, isLoading: favoritesLoading } = useQuery({
        queryKey: ['user-favorites', profile?.id],
        queryFn: () => profileService.fetchFavoriteSpots(profile!.id),
        enabled: !!profile?.id && !contest.criteria.require_spot_creator_is_competitor,
    });

    const eligibleSpots = useMemo(() => {
        if (!userContent) return [];

        const requiredMediaTypes = contest.criteria.required_media_types || ['video'];
        const now = new Date();

        const qualifiedMedia = (userContent.userMedia || []).filter(media => {
            if (!requiredMediaTypes.includes(media.type)) return false;
            if (contest.criteria.media_creation_time_frame && contest.criteria.media_creation_time_frame !== 'anytime') {
                const mediaDate = new Date(media.created_at);
                let thresholdDate: Date;
                switch (contest.criteria.media_creation_time_frame) {
                    case 'during_competition': thresholdDate = new Date(contest.start_date); break;
                    case 'last_30_days': thresholdDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
                    case 'last_60_days': thresholdDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000); break;
                    case 'last_90_days': thresholdDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
                    default: thresholdDate = new Date(0);
                }
                if (mediaDate < thresholdDate) return false;
            }
            return true;
        });

        const qualifiedSpotIds = new Set(qualifiedMedia.map(m => m.spot.id));
        const spotsToFilter = [...(userContent?.createdSpots || []), ...(favoriteSpots || [])];
        const uniqueSpots = Array.from(new Map(spotsToFilter.map(item => [item.id, item])).values());

        if (uniqueSpots.length === 0) return [];

        return uniqueSpots.filter(spot => {
            if (!qualifiedSpotIds.has(spot.id)) return false;
            if (contest.criteria.min_date && new Date(spot.created_at!) < new Date(contest.criteria.min_date)) return false;
            if (contest.criteria.max_date && new Date(spot.created_at!) > new Date(contest.criteria.max_date)) return false;
            if (contest.criteria.allowed_spot_types && contest.criteria.allowed_spot_types.length > 0 && !spot.spot_type?.some(type => contest.criteria.allowed_spot_types?.includes(type))) return false;
            if (contest.criteria.allowed_difficulties && contest.criteria.allowed_difficulties.length > 0 && (!spot.difficulty || !contest.criteria.allowed_difficulties.includes(spot.difficulty))) return false;
            if (typeof contest.criteria.allowed_is_lit === 'boolean' && spot.is_lit !== contest.criteria.allowed_is_lit) return false;
            if (typeof contest.criteria.allowed_kickout_risk_max === 'number' && (!spot.kickout_risk || spot.kickout_risk > contest.criteria.allowed_kickout_risk_max)) return false;
            if (contest.criteria.specific_spot_id && spot.id !== contest.criteria.specific_spot_id) return false;

            const { location_latitude, location_longitude, location_radius_km } = contest.criteria;
            if (location_latitude && location_longitude && location_radius_km) {
                if (typeof spot.latitude !== 'number' || typeof spot.longitude !== 'number') return false;
                const distance = getDistance({ latitude: spot.latitude, longitude: spot.longitude }, { latitude: location_latitude, longitude: location_longitude });
                if (distance > location_radius_km * 1000) return false;
            }

            if (contest.criteria.require_spot_creator_is_competitor && spot.created_by !== profile?.id) return false;

            if (contest.criteria.spot_creation_time_frame && contest.criteria.spot_creation_time_frame !== 'anytime') {
                const spotDate = new Date(spot.created_at!);
                let thresholdDate: Date;
                switch (contest.criteria.spot_creation_time_frame) {
                    case 'during_competition': thresholdDate = new Date(contest.start_date); break;
                    case 'last_30_days': thresholdDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
                    case 'last_60_days': thresholdDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000); break;
                    case 'last_90_days': thresholdDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
                    default: thresholdDate = new Date(0);
                }
                if (spotDate < thresholdDate) return false;
            }
            return true;
        });
    }, [userContent, favoriteSpots, contest, profile]);

    const { data: spotDetails, isLoading: mediaLoading } = useQuery({
        queryKey: ['spot-media', selectedSpotId],
        queryFn: () => spotService.fetchSpotDetails(selectedSpotId!),
        enabled: !!selectedSpotId && activeStep >= 1,
    });

    const eligibleMedia = useMemo(() => {
        if (!spotDetails?.media || !profile) return [];
        const requiredMediaTypes = contest.criteria.required_media_types || ['video'];
        const now = new Date();

        return spotDetails.media.filter(item => {
            if (item.author.id !== profile.id) return false;
            if (!requiredMediaTypes.includes(item.type)) return false;
            if (contest.criteria.media_creation_time_frame && contest.criteria.media_creation_time_frame !== 'anytime') {
                const mediaDate = new Date(item.createdAt);
                let thresholdDate: Date;
                switch (contest.criteria.media_creation_time_frame) {
                    case 'during_competition': thresholdDate = new Date(contest.start_date); break;
                    case 'last_30_days': thresholdDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
                    case 'last_60_days': thresholdDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000); break;
                    case 'last_90_days': thresholdDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
                    default: thresholdDate = new Date(0);
                }
                if (mediaDate < thresholdDate) return false;
            }
            return true;
        });
    }, [spotDetails, contest, profile]);

    const submitMutation = useMutation({
        mutationFn: () => contestService.submitEntry(contest.id, selectedSpotId!, selectedMediaType!, selectedMediaId!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contests', contest.id, 'entries'] });
            onClose();
            setActiveStep(0);
            setSelectedSpotId(null);
            setSelectedMediaId(null);
        },
    });

    return {
        activeStep,
        setActiveStep,
        selectedSpotId,
        setSelectedSpotId,
        selectedMediaId,
        setSelectedMediaId,
        selectedMediaType,
        setSelectedMediaType,
        eligibleSpots,
        eligibleMedia,
        spotDetails,
        spotsLoading,
        favoritesLoading,
        mediaLoading,
        submitEntry: submitMutation.mutate,
        isSubmitting: submitMutation.isPending,
        submitError: submitMutation.error as Error | null,
    };
}
