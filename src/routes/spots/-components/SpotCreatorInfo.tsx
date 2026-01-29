import { Box, Typography, Button } from '@mui/material';
import { ChatBubbleOutline } from '@mui/icons-material';
import { Link, useNavigate } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';
import { userAtom } from 'src/atoms/auth';
import { chatService } from 'src/services/chatService';

interface SpotCreatorInfoProps {
    createdAt?: string;
    username?: string;
    createdBy?: string;
}

export const SpotCreatorInfo = ({ createdAt, username, createdBy }: SpotCreatorInfoProps) => {
    const navigate = useNavigate();
    const user = useAtomValue(userAtom);
    const isMe = user?.user.id === createdBy;

    const formattedDate = createdAt ? new Date(createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }) : '';

    const handleMessage = async () => {
        if (!user?.user.id || !createdBy) return;
        try {
            const chatId = await chatService.getOrCreate1on1(user.user.id, createdBy);
            navigate({ to: '/chat/$conversationId', params: { conversationId: chatId } });
        } catch (error) {
            console.error('Error starting chat:', error);
        }
    };

    return (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Box>
                {createdAt && (
                    <Typography variant="body2" color="text.secondary" component="div">
                        Added on {formattedDate}
                    </Typography>
                )}

                {username && (
                    <Typography variant="body2" component="div">
                        Created by{' '}
                        <Link
                            to="/profile/$username"
                            params={{ username }}
                            style={{ fontWeight: 600, color: 'inherit', textDecoration: 'none' }}
                        >
                            @{username}
                        </Link>
                    </Typography>
                )}
            </Box>

            {createdBy && !isMe && user && (
                <Button
                    size="small"
                    startIcon={<ChatBubbleOutline />}
                    onClick={handleMessage}
                >
                    Message
                </Button>
            )}
        </Box>
    );
};
