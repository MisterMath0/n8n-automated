-- N8N AI Workflow Generator Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Workflows table
CREATE TABLE IF NOT EXISTS public.workflows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    workflow_data JSONB NOT NULL,
    tags TEXT[] DEFAULT '{}',
    status TEXT CHECK (status IN ('active', 'inactive', 'archived')) DEFAULT 'active',
    owner_id UUID REFERENCES auth.users(id) NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_generated_at TIMESTAMP WITH TIME ZONE,
    ai_model_used TEXT,
    generation_time_ms INTEGER,
    tokens_used INTEGER
);

-- Enable RLS
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

-- Workflows policies
CREATE POLICY "Users can view own workflows" ON public.workflows
    FOR SELECT USING (auth.uid() = owner_id OR is_public = true);

CREATE POLICY "Users can insert own workflows" ON public.workflows
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own workflows" ON public.workflows
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own workflows" ON public.workflows
    FOR DELETE USING (auth.uid() = owner_id);

-- Workflow versions table
CREATE TABLE IF NOT EXISTS public.workflow_versions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    workflow_data JSONB NOT NULL,
    changes_summary TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.workflow_versions ENABLE ROW LEVEL SECURITY;

-- Workflow versions policies
CREATE POLICY "Users can view own workflow versions" ON public.workflow_versions
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert own workflow versions" ON public.workflow_versions
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    workflow_id UUID REFERENCES public.workflows(id),
    title TEXT,
    total_tokens INTEGER DEFAULT 0,
    max_context_tokens INTEGER DEFAULT 8000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can access own conversations" ON public.conversations
    FOR ALL USING (auth.uid() = user_id);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    role TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
    message_type TEXT CHECK (message_type IN ('text', 'workflow', 'error')) DEFAULT 'text',
    workflow_data JSONB,
    token_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Messages policies
CREATE POLICY "Users can access own messages" ON public.messages
    FOR ALL USING (
        conversation_id IN (
            SELECT id FROM public.conversations WHERE user_id = auth.uid()
        )
    );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflows_owner_id ON public.workflows(owner_id);
CREATE INDEX IF NOT EXISTS idx_workflows_updated_at ON public.workflows(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_versions_workflow_id ON public.workflow_versions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at 
    BEFORE UPDATE ON public.workflows 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON public.conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
