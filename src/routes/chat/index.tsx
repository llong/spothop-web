import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { Container, Typography, Box, List, ListItem, ListItemAvatar, Avatar, ListItemText, Paper, Badge, Chip, Stack, Button, Tabs, Tab } from '@mui/material';
import { useConversationsQuery } from 'src/hooks/useChatQueries';
import { useAtomValue } from 'jotai';
import { userAtom } from 'src/atoms/auth';
import { formatDistanceToNow } from 'date-fns';
import { ChatBubbleOutline, GroupsOutlined, PersonOutline } from '@mui/icons-material';
import supabase from 'src/supabase';
import { useState } from 'react';
import { chatService } from 'src/services/chatService';
import { useQueryClient } from '@tanstack/react-query';
import { CreateGroupDialog } from './-components/CreateGroupDialog';
import { Add } from '@mui/icons-material';
import { ListItemSecondaryAction } from '@mui/material';

const ChatInboxComponent = () => {
    const user = useAtomValue(userAtom);
    const { data: conversations = [], isLoading } = useConversationsQuery(user?.user.id);
    const [tab, setTab] = useState(0);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const queryClient = useQueryClient();

    const activeChats = (conversations || []).filter(c =>
        c.participants.find(p => p.user_id === user?.user.id)?.status === 'accepted'
    );

    const invites = (conversations || []).filter(c =>
        c.participants.find(p => p.user_id === user?.user.id)?.status === 'pending'
    );

    const handleInviteResponse = async (conversationId: string, status: 'accepted' | 'rejected') => {
        if (!user?.user.id) return;
        try {
            await chatService.respondToInvite(conversationId, user.user.id, status);
            queryClient.invalidateQueries({ queryKey: ['chat', 'inbox', user.user.id] });
        } catch (error) {
            console.error('Error responding to invite:', error);
        }
    };

    if (isLoading && (conversations?.length ?? 0) === 0) {
        return <Container sx={{ mt: 4 }}><Typography>Loading your messages...</Typography></Container>;
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h4" fontWeight={700}>Messages</Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setIsCreateOpen(true)}
                    size="small"
                >
                    New Group
                </Button>
            </Stack>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                    <Tab label={`Chats (${activeChats.length})`} />
                    <Tab
                        label={
                            <Badge badgeContent={invites.length} color="error" sx={{ '& .MuiBadge-badge': { right: -10 } }}>
                                Invites
                            </Badge>
                        }
                    />
                </Tabs>
            </Box>

            <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                {tab === 0 ? (
                    <List sx={{ p: 0 }}>
                        {activeChats.length === 0 ? (
                            <Box sx={{ p: 4, textAlign: 'center' }}>
                                <ChatBubbleOutline sx={{ fontSize: 48, color: 'grey.300', mb: 2 }} />
                                <Typography color="text.secondary">No active conversations.</Typography>
                                <Typography variant="body2" color="text.secondary">Start a chat from a user's profile!</Typography>
                            </Box>
                        ) : (
                            activeChats.map((chat) => {
                                const otherParticipant = chat.participants.find(p => p.user_id !== user?.user.id);
                                const displayName = chat.is_group ? chat.name : otherParticipant?.profile?.displayName || otherParticipant?.profile?.username;

                                return (
                                    <ListItem
                                        key={chat.id}
                                        disablePadding
                                        divider
                                    >
                                        <Link
                                            to="/chat/$conversationId"
                                            params={{ conversationId: chat.id }}
                                            style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}
                                        >
                                            <Box sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                p: 2.5,
                                                '&:hover': { bgcolor: 'action.hover' },
                                                transition: 'background-color 0.2s'
                                            }}>
                                                <ListItemAvatar>
                                                    <Avatar
                                                        src={chat.is_group ? undefined : otherParticipant?.profile?.avatarUrl || ""}
                                                        sx={{ width: 48, height: 48, mr: 1 }}
                                                    >
                                                        {chat.is_group ? <GroupsOutlined /> : <PersonOutline />}
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                            <Typography variant="subtitle1" fontWeight={700} component="span">
                                                                {displayName}
                                                            </Typography>
                                                            {chat.is_group && (
                                                                <Chip
                                                                    label="Group"
                                                                    size="small"
                                                                    variant="outlined"
                                                                    sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }}
                                                                />
                                                            )}
                                                            {chat.unreadCount > 0 && (
                                                                <Chip
                                                                    label={`${chat.unreadCount} new`}
                                                                    size="small"
                                                                    color="primary"
                                                                    sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                                                                />
                                                            )}
                                                        </Box>
                                                    }
                                                    secondary={
                                                        <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', gap: 2 }}>
                                                            <Typography
                                                                variant="body2"
                                                                color={chat.unreadCount > 0 ? "text.primary" : "text.secondary"}
                                                                noWrap
                                                                sx={{ flexGrow: 1, maxWidth: 'calc(100% - 100px)', fontWeight: chat.unreadCount > 0 ? 500 : 400 }}
                                                                component="span"
                                                            >
                                                                {chat.lastMessage ? (
                                                                    <>
                                                                        <Box component="span" sx={{ fontWeight: 700 }}>
                                                                            {chat.lastMessage.author?.username}
                                                                        </Box>
                                                                        : {chat.lastMessage.content}
                                                                    </>
                                                                ) : 'No messages yet'}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', mt: 0.2 }}>
                                                                Last message {formatDistanceToNow(new Date(chat.last_message_at), { addSuffix: true })}
                                                            </Typography>
                                                        </Box>
                                                    }
                                                    secondaryTypographyProps={{ component: 'div' }}
                                                />
                                            </Box>
                                        </Link>
                                    </ListItem>
                                );
                            })
                        )}
                    </List>
                ) : (
                    <List sx={{ p: 0 }}>
                        {invites.length === 0 ? (
                            <Box sx={{ p: 4, textAlign: 'center' }}>
                                <Typography color="text.secondary">No pending invitations.</Typography>
                            </Box>
                        ) : (
                            invites.map((chat) => {
                                const creator = chat.participants.find(p => p.user_id === chat.created_by);

                                return (
                                    <ListItem key={chat.id} divider sx={{ py: 2 }}>
                                        <ListItemAvatar>
                                            <Avatar src={creator?.profile?.avatarUrl || ""}>
                                                <GroupsOutlined />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={<Typography variant="subtitle1" fontWeight={700}>{chat.name || "New Group Chat"}</Typography>}
                                            secondary={`Invited by @${creator?.profile?.username || 'someone'} • ${formatDistanceToNow(new Date(chat.created_at), { addSuffix: true })}`}
                                        />
                                        <ListItemSecondaryAction>
                                            <Stack direction="row" spacing={1}>
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => handleInviteResponse(chat.id, 'accepted')}
                                                >
                                                    Accept
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    size="small"
                                                    onClick={() => handleInviteResponse(chat.id, 'rejected')}
                                                >
                                                    Decline
                                                </Button>
                                            </Stack>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                );
                            })
                        )}
                    </List>
                )}
            </Paper>

            {user?.user.id && (
                <CreateGroupDialog
                    open={isCreateOpen}
                    onClose={() => setIsCreateOpen(false)}
                    currentUserId={user.user.id}
                />
            )}
        </Container>
    );
};

export const Route = createFileRoute('/chat/')({
    component: ChatInboxComponent,
    beforeLoad: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw redirect({ to: '/login' });
    }
});
