import { useState } from 'react';
import { Box, TextField, Button, CircularProgress, Stack, Avatar } from '@mui/material';
import { useAtomValue } from 'jotai';
import { userAtom } from 'src/atoms/auth';
import { useProfile } from 'src/hooks/useProfile';

interface CommentFormProps {
    onSubmit: (content: string) => Promise<{ success: boolean; error?: string }>;
    placeholder?: string;
    initialValue?: string;
    onCancel?: () => void;
    autoFocus?: boolean;
    submitLabel?: string;
}

export const CommentForm = ({
    onSubmit,
    placeholder = "Add a comment...",
    initialValue = "",
    onCancel,
    autoFocus = false,
    submitLabel = "Post"
}: CommentFormProps) => {
    const user = useAtomValue(userAtom);
    const { profile } = useProfile();
    const [content, setContent] = useState(initialValue);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!content.trim()) return;

        try {
            setIsSubmitting(true);
            const result = await onSubmit(content.trim());
            if (result.success) {
                setContent('');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) return null;

    return (
        <Box sx={{ mt: 2 }}>
            <Stack direction="row" spacing={2} alignItems="flex-start">
                <Avatar
                    src={profile?.avatarUrl || undefined}
                    sx={{ width: 40, height: 40, mt: 0.5 }}
                />
                <Box sx={{ flexGrow: 1 }}>
                    <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        maxRows={10}
                        placeholder={placeholder}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        autoFocus={autoFocus}
                        disabled={isSubmitting}
                        variant="outlined"
                        size="small"
                        sx={{ bgcolor: 'white' }}
                    />
                    <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1 }}>
                        {onCancel && (
                            <Button
                                size="small"
                                onClick={onCancel}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                        )}
                        <Button
                            variant="contained"
                            size="small"
                            onClick={handleSubmit}
                            disabled={!content.trim() || isSubmitting}
                        >
                            {isSubmitting ? <CircularProgress size={20} color="inherit" /> : submitLabel}
                        </Button>
                    </Stack>
                </Box>
            </Stack>
        </Box>
    );
};
