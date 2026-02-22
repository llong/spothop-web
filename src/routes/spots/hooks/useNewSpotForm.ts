import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { v4 as uuidv4 } from 'uuid';
import { useAtomValue } from 'jotai';
import { userAtom } from 'src/atoms/auth';
import { useMediaUpload } from 'src/hooks/useMediaUpload';
import { useOnlineStatus } from 'src/hooks/useOnlineStatus';
import { reverseGeocode } from 'src/utils/geocoding';
import { analytics } from 'src/lib/posthog';
import type { VideoAsset } from 'src/types';
import supabase from 'src/supabase';

export function useNewSpotForm(lat: number, lng: number) {
    const isOnline = useOnlineStatus();
    const navigate = useNavigate();
    const user = useAtomValue(userAtom);

    // Form State
    const [address, setAddress] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [country, setCountry] = useState('');

    // File selection state
    const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
    const [selectedVideos, setSelectedVideos] = useState<VideoAsset[]>([]);

    const [spotId, setSpotId] = useState<string | null>(null);
    const [spotType, setSpotType] = useState<string[]>([]);
    const [difficulty, setDifficulty] = useState('beginner');
    const [kickoutRisk, setKickoutRisk] = useState<number>(1);
    const [isLit, setIsLit] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    const { uploadMedia } = useMediaUpload({ user, setStatusMessage });

    useEffect(() => {
        setSpotId(uuidv4());
    }, []);

    useEffect(() => {
        const getAddress = async () => {
            try {
                const info = await reverseGeocode(lat, lng);
                if (info.formattedAddress) {
                    setAddress(info.formattedAddress);
                    setPostalCode(info.postalCode || '');
                    setCity(info.city || '');
                    setState(info.state || '');
                    setCountry(info.country || '');
                }
            } catch (e) {
                console.error("Failed to fetch address", e);
            }
        };
        getAddress();
    }, [lat, lng]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);

        if (!name.trim()) { setError('Spot Name is required.'); return; }
        if (!description.trim()) { setError('Description is required.'); return; }
        if (selectedPhotos.length === 0) { setError('You must upload at least one photo.'); return; }
        if (!user) { setError('You must be logged in to create a spot.'); return; }
        if (!spotId) return;

        try {
            setIsSubmitting(true);
            setStatusMessage('Creating spot...');

            const { error: spotError } = await supabase
                .from('spots')
                .insert([{
                    id: spotId,
                    name,
                    description,
                    address,
                    state,
                    city,
                    country,
                    postal_code: postalCode,
                    latitude: lat,
                    longitude: lng,
                    created_by: user.user.id,
                    spot_type: spotType,
                    difficulty,
                    kickout_risk: kickoutRisk,
                    is_lit: isLit,
                }]);

            if (spotError) throw spotError;

            await uploadMedia(spotId, selectedPhotos, selectedVideos);

            analytics.capture('spot_created', {
                spot_id: spotId,
                category: spotType,
                difficulty,
                has_media: selectedPhotos.length > 0 || selectedVideos.length > 0,
                has_description: !!description,
                city,
                country
            });

            setSuccess(true);
            setStatusMessage('Spot created successfully!');

            setTimeout(() => {
                navigate({ to: '/', search: { lat, lng } });
            }, 1500);

        } catch (err: any) {
            console.error('Error creating spot:', err);
            setError(err.message || 'An unexpected error occurred.');
            setIsSubmitting(false);
        }
    };

    return {
        formState: {
            name, setName,
            description, setDescription,
            spotType, setSpotType,
            difficulty, setDifficulty,
            isLit, setIsLit,
            kickoutRisk, setKickoutRisk,
            selectedPhotos, setSelectedPhotos,
            selectedVideos, setSelectedVideos,
            address,
        },
        submissionState: {
            isSubmitting,
            error,
            setError,
            success,
            statusMessage,
            isOnline,
        },
        handleSubmit
    };
}
