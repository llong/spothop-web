import { useState } from 'react';
import { TextField, Button, Box } from '@mui/material';
import type { SpotComment } from 'src/types';

interface CommentEditorProps {
    comment: SpotComment;
    onEdit: (commentId: string, content: string) => Promise<{ success: boolean; error?: string }>;
    onCancel: () => void;
}

export const CommentEditor = ({ comment, onEdit, onCancel }: CommentEditorProps) => {
    const [content, setContent] = useState(comment.content);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsSubmitting(true);
        const result = await onEdit(comment.id, content);
        setIsSubmitting(false);

        if (result.success) {
            onCancel();
        } else {
            alert(result.error || 'Failed to edit comment');
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
                fullWidth
                multiline
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Edit your comment..."
                size="small"
                sx={{ mb: 1 }}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                    type="submit"
                    variant="contained"
                    size="small"
                    disabled={isSubmitting || !content.trim()}
                >
                    {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
                <Button
                    type="button"
                    variant="outlined"
                    size="small"
                    onClick={onCancel}
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
            </Box>
        </Box>
    );
};