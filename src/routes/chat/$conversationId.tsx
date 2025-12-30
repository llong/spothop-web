import { createFileRoute, redirect, useRouter } from '@tanstack/react-router';
import { Container, Box, Typography, Paper, TextField, IconButton, Stack, Avatar, AppBar, Toolbar, CircularProgress } from '@mui/material';
import { Send, ArrowBack, InfoOutlined } from '@mui/icons-material';
import { useMessagesQuery, useSendMessageMutation, useConversationQuery } from 'src/hooks/useChatQueries';
import { useAtomValue } from 'jotai';
import { userAtom } from 'src/atoms/auth';
import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import supabase from 'src/supabase';
import { ChatSettingsDialog } from './-components/ChatSettingsDialog';

const ChatRoomComponent = () => {
    const { conversationId } = Route.useParams();
    const user = useAtomValue(userAtom);
    const router = useRouter();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { data: messages = [], isLoading: loadingMessages } = useMessagesQuery(conversationId);
    const { data: chat, isLoading: loadingChat } = useConversationQuery(conversationId, user?.user.id);
    const sendMessageMutation = useSendMessageMutation(conversationId);

    const [content, setContent] = useState('');
    const [settingsOpen, setSettingsOpen] = useState(false);

    const otherParticipant = chat?.participants.find((p: any) => p.user_id !== user?.user.id);
    const chatTitle = chat?.is_group ? chat.name : otherParticipant?.profile?.displayName || otherParticipant?.profile?.username;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || !user?.user.id) return;

        const messageContent = content.trim();
        setContent('');

        try {
            await sendMessageMutation.mutateAsync({
                senderId: user.user.id,
                content: messageContent
            });
        } catch (error) {
            console.error('Failed to send message:', error);
            setContent(messageContent); // Restore on error
        }
    };

    if (loadingChat || loadingMessages) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', bgcolor: 'grey.50' }}>
            {/* Chat Header */}
            <AppBar position="static" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Toolbar>
                    <IconButton edge="start" onClick={() => router.history.back()} sx={{ mr: 2 }}>
                        <ArrowBack />
                    </IconButton>
                    <Avatar src={chat?.is_group ? "" : otherParticipant?.profile?.avatarUrl || ""} sx={{ mr: 2 }}>
                        {chat?.is_group ? 'G' : 'U'}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" fontWeight={700}>{chatTitle || 'Chat'}</Typography>
                        {chat?.is_group && (
                            <Typography variant="caption" color="text.secondary">
                                {chat.participants.length} members
                            </Typography>
                        )}
                    </Box>
                    <IconButton onClick={() => setSettingsOpen(true)}>
                        <InfoOutlined />
                    </IconButton>
                </Toolbar>
            </AppBar>

            {/* Message Area */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
                <Container maxWidth="md">
                    <Stack spacing={2}>
                        {(messages || []).map((msg, index) => {
                            const isMe = msg.sender_id === user?.user.id;
                            const showAvatar = index === 0 || (messages && messages[index - 1].sender_id !== msg.sender_id);

                            return (
                                <Box
                                    key={msg.id}
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: isMe ? 'flex-end' : 'flex-start'
                                    }}
                                >
                                    <Stack direction={isMe ? 'row-reverse' : 'row'} spacing={1} alignItems="flex-end">
                                        {!isMe && showAvatar && (
                                            <Avatar
                                                src={msg.author?.avatarUrl || ""}
                                                sx={{ width: 28, height: 28, mb: 0.5 }}
                                            />
                                        )}
                                        {!isMe && !showAvatar && <Box sx={{ width: 36 }} />}

                                        <Paper
                                            elevation={0}
                                            sx={{
                                                p: 1.5,
                                                maxWidth: '400px',
                                                bgcolor: isMe ? 'primary.main' : 'white',
                                                color: isMe ? 'primary.contrastText' : 'inherit',
                                                borderRadius: 2,
                                                borderTopRightRadius: isMe && !showAvatar ? 2 : (isMe ? 0 : 2),
                                                borderTopLeftRadius: !isMe && !showAvatar ? 2 : (!isMe ? 0 : 2),
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                            }}
                                        >
                                            <Typography variant="body2">{msg.content}</Typography>
                                        </Paper>
                                    </Stack>
                                    {showAvatar && (
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, mx: isMe ? 0 : 4.5 }}>
                                            {format(new Date(msg.created_at), 'h:mm a')}
                                        </Typography>
                                    )}
                                </Box>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </Stack>
                </Container>
            </Box>

            {/* Input Area */}
            <Box sx={{ p: 2, bgcolor: 'white', borderTop: 1, borderColor: 'divider' }}>
                <Container maxWidth="md">
                    <Box component="form" onSubmit={handleSend} sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Type a message..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            disabled={sendMessageMutation.isPending}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 4,
                                    bgcolor: 'grey.50'
                                }
                            }}
                        />
                        <IconButton
                            color="primary"
                            type="submit"
                            disabled={!content.trim() || sendMessageMutation.isPending}
                        >
                            <Send />
                        </IconButton>
                    </Box>
                </Container>
            </Box>

            {chat && (
                <ChatSettingsDialog
                    open={settingsOpen}
                    onClose={() => setSettingsOpen(false)}
                    chat={chat}
                    currentUserId={user!.user.id}
                />
            )}
        </Box>
    );
};

export const Route = createFileRoute('/chat/$conversationId')({
    component: ChatRoomComponent,
    beforeLoad: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw redirect({ to: '/login' });
    }
});
