
import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { debounce } from '@mui/material';
import { adminContestService } from '../../../services/adminContestService';
import { profileService } from '@/services/profileService';
import type { Contest, ContestCriteria } from '../../../types';

// Define the return type for useContestForm hook
interface UseContestFormReturn {
    formData: Partial<Contest>;
    setFormData: React.Dispatch<React.SetStateAction<Partial<Contest>>>;
    flyerFile: File | null;
    setFlyerFile: React.Dispatch<React.SetStateAction<File | null>>;
    judgeSearchResults: any[];
    selectedJudges: any[];
    setSelectedJudges: React.Dispatch<React.SetStateAction<any[]>>;
    radiusUnit: 'km' | 'miles';
    setRadiusUnit: React.Dispatch<React.SetStateAction<'km' | 'miles'>>;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleCriteriaChange: (key: keyof ContestCriteria, value: any) => void;
    debouncedJudgeSearch: ReturnType<typeof debounce>;
    saveContest: () => void;
    isSaving: boolean;
}

export function useContestForm(contest: Contest | null, onClose: () => void): UseContestFormReturn {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<Partial<Contest>>({
        title: '',
        description: '',
        status: 'draft',
        voting_type: 'public',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        criteria: {} as ContestCriteria
    });
    const [flyerFile, setFlyerFile] = useState<File | null>(null);
    const [judgeSearchResults, setJudgeSearchResults] = useState<any[]>([]);
    const [selectedJudges, setSelectedJudges] = useState<any[]>([]);
    const [radiusUnit, setRadiusUnit] = useState<'km' | 'miles'>('miles');

    useEffect(() => {
        const initialData = contest || {
            title: '',
            description: '',
            status: 'draft',
            voting_type: 'public',
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            criteria: {} as ContestCriteria
        };

        setFormData(initialData);

        if (initialData.criteria?.judges?.length) {
            const fetchExistingJudges = async () => {
                const fetchedJudges = await Promise.all(
                    initialData.criteria.judges!.map(id => profileService.fetchIdentity(id))
                );
                setSelectedJudges(fetchedJudges.filter(Boolean));
            };
            fetchExistingJudges();
        } else {
            setSelectedJudges([]);
        }
    }, [contest]);

    const debouncedJudgeSearch = useMemo<ReturnType<typeof debounce>>(() =>
        debounce(async (query: string) => {
            if (query.length > 1) {
                const results = await profileService.searchUsers(query);
                setJudgeSearchResults(results);
            } else {
                setJudgeSearchResults([]);
            }
        }, 300),
        []);

    const mutation = useMutation({
        mutationFn: (data: Partial<Contest>) =>
            contest
                ? adminContestService.updateContest(contest.id, data, flyerFile)
                : adminContestService.createContest(data, flyerFile),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'contests'] });
            queryClient.invalidateQueries({ queryKey: ['contests'] });
            onClose();
        }
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCriteriaChange = (key: keyof ContestCriteria, value: any) => {
        setFormData(prev => ({
            ...prev,
            criteria: {
                ...prev.criteria,
                [key]: value
            }
        }));
    };

    return {
        formData,
        setFormData,
        flyerFile,
        setFlyerFile,
        judgeSearchResults,
        selectedJudges,
        setSelectedJudges,
        radiusUnit,
        setRadiusUnit,
        handleChange,
        handleCriteriaChange,
        debouncedJudgeSearch,
        saveContest: () => mutation.mutate(formData),
        isSaving: mutation.isPending
    };
}
