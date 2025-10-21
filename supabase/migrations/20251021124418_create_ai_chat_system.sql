/*
  # AI Chat Assistant System

  ## New Tables Created
  
  ### 1. `chat_conversations`
  Stores user chat sessions with the AI assistant
  - `id` (uuid, primary key)
  - `profile_id` (uuid) - References profiles.id
  - `title` (text) - Auto-generated conversation title
  - `status` (text) - 'active', 'completed', 'archived'
  - `metadata` (jsonb) - Stores context (child age, preferences, etc.)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `chat_messages`
  Individual messages in conversations
  - `id` (uuid, primary key)
  - `conversation_id` (uuid) - References chat_conversations.id
  - `role` (text) - 'user', 'assistant', 'system'
  - `content` (text) - Message text
  - `message_type` (text) - 'text', 'quick_reply', 'recommendation'
  - `metadata` (jsonb) - Store button data, activity IDs, etc.
  - `created_at` (timestamptz)

  ### 3. `chat_recommendations`
  Track recommended activities in conversations
  - `id` (uuid, primary key)
  - `conversation_id` (uuid) - References chat_conversations.id
  - `activity_id` (uuid) - References activities.id
  - `score` (numeric) - Recommendation relevance score (0-1)
  - `reason` (text) - Why this was recommended
  - `was_viewed` (boolean) - User clicked to view
  - `was_favorited` (boolean) - User added to favorites
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access their own conversations
  - Public read access for shared conversations (future feature)
*/

-- Create chat_conversations table
CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text DEFAULT 'New Conversation',
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON chat_conversations FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Users can create own conversations"
  ON chat_conversations FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own conversations"
  ON chat_conversations FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can delete own conversations"
  ON chat_conversations FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES chat_conversations(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'quick_reply', 'recommendation', 'activity_card')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages from own conversations"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM chat_conversations WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own conversations"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM chat_conversations WHERE profile_id = auth.uid()
    )
  );

-- Create chat_recommendations table
CREATE TABLE IF NOT EXISTS chat_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES chat_conversations(id) ON DELETE CASCADE NOT NULL,
  activity_id uuid REFERENCES activities(id) ON DELETE CASCADE NOT NULL,
  score numeric DEFAULT 1.0 CHECK (score >= 0 AND score <= 1),
  reason text,
  was_viewed boolean DEFAULT false,
  was_favorited boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view recommendations from own conversations"
  ON chat_recommendations FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM chat_conversations WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can create recommendations in own conversations"
  ON chat_recommendations FOR INSERT
  TO authenticated
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM chat_conversations WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can update recommendations in own conversations"
  ON chat_recommendations FOR UPDATE
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM chat_conversations WHERE profile_id = auth.uid()
    )
  )
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM chat_conversations WHERE profile_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_conversations_profile ON chat_conversations(profile_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_status ON chat_conversations(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_recommendations_conversation ON chat_recommendations(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_recommendations_activity ON chat_recommendations(activity_id);

-- Create function to auto-update conversation updated_at
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update conversation timestamp when messages are added
DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON chat_messages;
CREATE TRIGGER trigger_update_conversation_timestamp
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();
