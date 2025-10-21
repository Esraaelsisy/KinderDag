import { supabase } from '@/lib/supabase';
import { activitiesService } from './activities';

export interface ChatMessage {
  id?: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  message_type: 'text' | 'quick_reply' | 'recommendation' | 'activity_card';
  metadata?: any;
  created_at?: string;
}

export interface Conversation {
  id: string;
  profile_id: string;
  title: string;
  status: 'active' | 'completed' | 'archived';
  metadata: ConversationContext;
  created_at: string;
  updated_at: string;
}

export interface ConversationContext {
  childAge?: number;
  interests?: string[];
  location?: { lat: number; lng: number; name: string };
  budget?: 'free' | 'low' | 'medium' | 'high';
  timeframe?: 'today' | 'weekend' | 'next_week' | 'anytime';
  indoor?: boolean;
  outdoor?: boolean;
  currentStep?: string;
}

export interface QuickReply {
  text: string;
  value: string;
  icon?: string;
}

export const aiChatService = {
  /**
   * Create a new conversation
   */
  async createConversation(userId: string): Promise<Conversation> {
    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({
        profile_id: userId,
        title: 'New Conversation',
        status: 'active',
        metadata: { currentStep: 'greeting' },
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get user's conversations
   */
  async getConversations(userId: string): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('profile_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Add a message to conversation
   */
  async addMessage(message: Omit<ChatMessage, 'id' | 'created_at'>): Promise<ChatMessage> {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert(message)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update conversation metadata (context)
   */
  async updateContext(
    conversationId: string,
    context: Partial<ConversationContext>
  ): Promise<void> {
    // Get current metadata
    const { data: conversation } = await supabase
      .from('chat_conversations')
      .select('metadata')
      .eq('id', conversationId)
      .single();

    const newMetadata = {
      ...(conversation?.metadata || {}),
      ...context,
    };

    const { error } = await supabase
      .from('chat_conversations')
      .update({ metadata: newMetadata })
      .eq('id', conversationId);

    if (error) throw error;
  },

  /**
   * Process user message and generate bot response
   */
  async processMessage(
    conversationId: string,
    userMessage: string,
    context: ConversationContext
  ): Promise<{ messages: ChatMessage[]; quickReplies?: QuickReply[] }> {
    const currentStep = context.currentStep || 'greeting';
    const responses: ChatMessage[] = [];
    let quickReplies: QuickReply[] | undefined;

    // State machine for conversation flow
    switch (currentStep) {
      case 'greeting':
        responses.push({
          conversation_id: conversationId,
          role: 'assistant',
          content: "Hi! I'm KinderDag Assistant 👋 I'll help you find the perfect activity for your child!\n\nLet's start: How old is your child?",
          message_type: 'text',
        });
        quickReplies = [
          { text: '0-2 years', value: '1', icon: '👶' },
          { text: '3-5 years', value: '4', icon: '🧒' },
          { text: '6-8 years', value: '7', icon: '👦' },
          { text: '9-12 years', value: '10', icon: '👧' },
          { text: '13+ years', value: '14', icon: '🧑' },
        ];
        await this.updateContext(conversationId, { currentStep: 'age' });
        break;

      case 'age':
        const age = parseInt(userMessage);
        await this.updateContext(conversationId, { childAge: age, currentStep: 'interests' });
        responses.push({
          conversation_id: conversationId,
          role: 'assistant',
          content: `Great! What is your ${age < 3 ? 'baby' : 'child'} interested in? You can select multiple!`,
          message_type: 'text',
        });
        quickReplies = [
          { text: '🎨 Arts & Crafts', value: 'arts', icon: '🎨' },
          { text: '⚽ Sports', value: 'sports', icon: '⚽' },
          { text: '🎭 Theater', value: 'theater', icon: '🎭' },
          { text: '🔬 Science', value: 'science', icon: '🔬' },
          { text: '🌳 Nature', value: 'nature', icon: '🌳' },
          { text: '🏛️ Museums', value: 'museums', icon: '🏛️' },
          { text: "I'm not sure", value: 'any', icon: '🤷' },
        ];
        break;

      case 'interests':
        const interests = userMessage.split(',').map((i) => i.trim());
        await this.updateContext(conversationId, { interests, currentStep: 'location' });
        responses.push({
          conversation_id: conversationId,
          role: 'assistant',
          content: 'Perfect! Do you prefer indoor or outdoor activities?',
          message_type: 'text',
        });
        quickReplies = [
          { text: '🏠 Indoor', value: 'indoor', icon: '🏠' },
          { text: '🌤️ Outdoor', value: 'outdoor', icon: '🌤️' },
          { text: '🤷 Either works', value: 'both', icon: '🤷' },
        ];
        break;

      case 'location':
        let indoor = false;
        let outdoor = false;
        if (userMessage === 'indoor') indoor = true;
        else if (userMessage === 'outdoor') outdoor = true;
        else {
          indoor = true;
          outdoor = true;
        }
        await this.updateContext(conversationId, { indoor, outdoor, currentStep: 'budget' });
        responses.push({
          conversation_id: conversationId,
          role: 'assistant',
          content: "What's your budget for today?",
          message_type: 'text',
        });
        quickReplies = [
          { text: '💸 Free', value: 'free', icon: '💸' },
          { text: '💵 €0-20', value: 'low', icon: '💵' },
          { text: '💶 €20-50', value: 'medium', icon: '💶' },
          { text: '💰 €50+', value: 'high', icon: '💰' },
        ];
        break;

      case 'budget':
        await this.updateContext(conversationId, { budget: userMessage as any, currentStep: 'recommend' });
        responses.push({
          conversation_id: conversationId,
          role: 'assistant',
          content: '🔍 Searching for perfect activities...',
          message_type: 'text',
        });
        break;

      case 'recommend':
        // This will be handled separately by getRecommendations
        break;
    }

    // Save all bot messages
    for (const msg of responses) {
      await this.addMessage(msg);
    }

    return { messages: responses, quickReplies };
  },

  /**
   * Get activity recommendations based on conversation context
   */
  async getRecommendations(
    conversationId: string,
    context: ConversationContext,
    userLocation?: { lat: number; lng: number }
  ) {
    try {
      // Get all activities
      let activities = await activitiesService.getAll();

      // Apply filters based on context
      if (context.childAge !== undefined) {
        activities = activities.filter(
          (a) => a.age_min <= context.childAge! && a.age_max >= context.childAge!
        );
      }

      if (context.indoor && !context.outdoor) {
        activities = activities.filter((a) => a.is_indoor);
      } else if (context.outdoor && !context.indoor) {
        activities = activities.filter((a) => a.is_outdoor);
      }

      if (context.budget === 'free') {
        activities = activities.filter((a) => a.is_free);
      } else if (context.budget === 'low') {
        activities = activities.filter((a) => a.is_free || a.price_max <= 20);
      } else if (context.budget === 'medium') {
        activities = activities.filter((a) => a.price_max <= 50);
      }

      // Sort by distance if location available
      if (userLocation) {
        activities = activitiesService.sortByDistance(
          activities,
          userLocation.lat,
          userLocation.lng
        );
      } else {
        // Sort by rating
        activities.sort((a, b) => b.average_rating - a.average_rating);
      }

      // Take top 5
      const topActivities = activities.slice(0, 5);

      // Save recommendations
      for (let i = 0; i < topActivities.length; i++) {
        const activity = topActivities[i];
        await supabase.from('chat_recommendations').insert({
          conversation_id: conversationId,
          activity_id: activity.id,
          score: 1 - i * 0.1, // Decreasing score
          reason: this.generateReason(activity, context),
        });
      }

      return topActivities;
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      return [];
    }
  },

  /**
   * Generate human-readable reason for recommendation
   */
  generateReason(activity: any, context: ConversationContext): string {
    const reasons: string[] = [];

    if (context.childAge !== undefined) {
      reasons.push(`Perfect for age ${context.childAge}`);
    }

    if (context.budget === 'free' && activity.is_free) {
      reasons.push('Free entry');
    }

    if (activity.average_rating >= 4.5) {
      reasons.push('Highly rated');
    }

    if (context.indoor && activity.is_indoor) {
      reasons.push('Indoor activity');
    } else if (context.outdoor && activity.is_outdoor) {
      reasons.push('Outdoor activity');
    }

    return reasons.join(' • ') || 'Recommended for you';
  },
};
