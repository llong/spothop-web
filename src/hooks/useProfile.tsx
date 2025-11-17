import { useEffect } from "react";
import { useAtom } from "jotai";
import { userAtom, profileAtom } from "../atoms/auth";
import supabase from "../supabase";
import type { UserProfile } from "../types";

export const useProfile = () => {
    const [user] = useAtom(userAtom);
    const [profile, setProfile] = useAtom(profileAtom);

    useEffect(() => {
        if (user) {
            getProfile();
        }
    }, [user]);

    const getProfile = async () => {
        try {
            if (!user) throw new Error("No user on the session!");

            const { data, error, status } = await supabase
                .from("profiles")
                .select(`username, "avatarUrl", city, country, "riderType", bio, "instagramHandle"`)
                .eq("id", user.user.id)
                .single();
            if (error && status !== 406) {
                throw error;
            }

            if (data) {
                setProfile(data as UserProfile);
            }
        } catch (error) {
            if (error instanceof Error) {
                alert(error.message);
            }
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

    return { profile, updateProfile, getProfile };
};
