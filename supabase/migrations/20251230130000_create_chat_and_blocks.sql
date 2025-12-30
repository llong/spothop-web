-- 1. Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT, -- Optional name for group chats
    is_group BOOLEAN DEFAULT false NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. Create conversation_participants table
CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(conversation_id, user_id)
);

-- 3. Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 4. Create user_blocks table
CREATE TABLE IF NOT EXISTS user_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(blocker_id, blocked_id)
);

-- 5. Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- Helper function to check participation without RLS recursion
CREATE OR REPLACE FUNCTION is_chat_participant(chat_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM conversation_participants 
        WHERE conversation_id = chat_id AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- User Blocks
CREATE POLICY "Users can view their own blocks" ON user_blocks FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "Users can manage their own blocks" ON user_blocks FOR ALL USING (auth.uid() = blocker_id);

-- Conversations
CREATE POLICY "Users view joined chats" ON conversations 
FOR SELECT USING (is_chat_participant(id));

CREATE POLICY "Users can create conversations" ON conversations 
FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Conversation Participants
CREATE POLICY "Users view participants" ON conversation_participants
FOR SELECT USING (is_chat_participant(conversation_id));

CREATE POLICY "Users can join conversations" ON conversation_participants
FOR INSERT WITH CHECK (
    -- Allow users to add themselves to a chat they just created
    (auth.uid() = user_id AND EXISTS (SELECT 1 FROM conversations WHERE id = conversation_id AND created_by = auth.uid()))
    OR
    -- Allow admins to add anyone
    EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = conversation_participants.conversation_id AND user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can manage participants" ON conversation_participants
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM conversation_participants 
        WHERE conversation_id = conversation_participants.conversation_id 
        AND user_id = auth.uid() 
        AND role = 'admin'
    )
);

CREATE POLICY "Admins can remove participants" ON conversation_participants
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM conversation_participants 
        WHERE conversation_id = conversation_participants.conversation_id 
        AND user_id = auth.uid() 
        AND role = 'admin'
    )
);

CREATE POLICY "Users can update their own participation status" ON conversation_participants
FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Messages
CREATE POLICY "Accepted participants can view messages" ON messages
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM conversation_participants 
        WHERE conversation_id = messages.conversation_id AND user_id = auth.uid() AND status = 'accepted'
    )
);

CREATE POLICY "Accepted participants can send messages" ON messages
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM conversation_participants 
        WHERE conversation_id = conversation_id AND user_id = auth.uid() AND status = 'accepted'
    )
    AND NOT EXISTS (
        -- Check if any participant has blocked the sender
        SELECT 1 FROM user_blocks 
        JOIN conversation_participants cp ON cp.user_id = blocker_id
        WHERE cp.conversation_id = messages.conversation_id AND blocked_id = auth.uid()
    )
);

-- 7. Triggers for last_message_at
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET last_message_at = now() 
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_message_update_chat
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();

-- 8. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
