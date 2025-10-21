import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { aiChatService, ChatMessage, QuickReply, ConversationContext } from '@/services/aiChat';
import { Colors } from '@/constants/colors';
import { Send, Bot, User } from 'lucide-react-native';
import ActivityCard from '@/components/ActivityCard';
import { supabase } from '@/lib/supabase';

export default function ChatScreen() {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [context, setContext] = useState<ConversationContext>({});
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (user) {
      initializeChat();
    }
  }, [user]);

  const initializeChat = async () => {
    try {
      setLoading(true);
      const conversation = await aiChatService.createConversation(user!.id);
      setConversationId(conversation.id);

      // Start with greeting
      const response = await aiChatService.processMessage(
        conversation.id,
        '',
        { currentStep: 'greeting' }
      );

      setMessages(response.messages);
      setQuickReplies(response.quickReplies || []);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (text: string, isQuickReply = false) => {
    if (!conversationId || !text.trim()) return;

    try {
      setLoading(true);

      // Add user message
      const userMessage: ChatMessage = {
        conversation_id: conversationId,
        role: 'user',
        content: text,
        message_type: isQuickReply ? 'quick_reply' : 'text',
      };

      const savedUserMessage = await aiChatService.addMessage(userMessage);
      setMessages((prev) => [...prev, savedUserMessage]);
      setInput('');
      setQuickReplies([]);

      // Get bot response
      const response = await aiChatService.processMessage(conversationId, text, context);

      setMessages((prev) => [...prev, ...response.messages]);
      setQuickReplies(response.quickReplies || []);

      // Update context
      const { data: conv } = await supabase
        .from('chat_conversations')
        .select('metadata')
        .eq('id', conversationId)
        .single();

      if (conv) {
        setContext(conv.metadata);

        // If we reached recommendation step, get recommendations
        if (conv.metadata.currentStep === 'recommend') {
          const recs = await aiChatService.getRecommendations(
            conversationId,
            conv.metadata,
            profile?.location_lat && profile?.location_lng
              ? { lat: profile.location_lat, lng: profile.location_lng }
              : undefined
          );

          setRecommendations(recs);

          // Add recommendation message
          const recMessage: ChatMessage = {
            conversation_id: conversationId,
            role: 'assistant',
            content: `🎉 Found ${recs.length} perfect activities for you!`,
            message_type: 'recommendation',
          };
          const savedRecMessage = await aiChatService.addMessage(recMessage);
          setMessages((prev) => [...prev, savedRecMessage]);
        }
      }

      // Scroll to bottom
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickReply = (reply: QuickReply) => {
    sendMessage(reply.value, true);
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';

    return (
      <View
        key={message.id}
        style={[styles.messageContainer, isUser ? styles.userMessage : styles.botMessage]}
      >
        <View style={styles.messageHeader}>
          {!isUser && <Bot size={20} color={Colors.primary} />}
          {isUser && <User size={20} color="white" />}
          <Text style={[styles.messageRole, isUser && styles.userMessageRole]}>
            {isUser ? 'You' : 'KinderBot'}
          </Text>
        </View>
        <Text style={[styles.messageText, isUser && styles.userMessageText]}>
          {message.content}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <Bot size={32} color={Colors.primary} />
        <View style={styles.headerText}>
          <Text style={styles.title}>KinderBot Assistant</Text>
          <Text style={styles.subtitle}>Find perfect activities for your child</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => renderMessage(message))}

        {recommendations.length > 0 && (
          <View style={styles.recommendationsContainer}>
            <Text style={styles.recommendationsTitle}>📍 Recommended Activities</Text>
            {recommendations.map((activity) => (
              <View key={activity.id} style={styles.activityCardWrapper}>
                <ActivityCard
                  id={activity.id}
                  name={activity.name}
                  city={activity.city}
                  image={activity.images?.[0] || 'https://images.pexels.com/photos/1648387/pexels-photo-1648387.jpeg'}
                  rating={activity.average_rating}
                  reviews={activity.total_reviews}
                  priceMin={activity.price_min}
                  priceMax={activity.price_max}
                  isFree={activity.is_free}
                  ageMin={activity.age_min}
                  ageMax={activity.age_max}
                />
              </View>
            ))}
          </View>
        )}

        {loading && (
          <View style={[styles.messageContainer, styles.botMessage]}>
            <Text style={styles.loadingText}>Typing...</Text>
          </View>
        )}
      </ScrollView>

      {quickReplies.length > 0 && (
        <View style={styles.quickRepliesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {quickReplies.map((reply, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickReplyButton}
                onPress={() => handleQuickReply(reply)}
                disabled={loading}
              >
                <Text style={styles.quickReplyText}>
                  {reply.icon} {reply.text}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          placeholderTextColor={Colors.mutedGrey}
          editable={!loading && quickReplies.length === 0}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
          onPress={() => sendMessage(input)}
          disabled={!input.trim() || loading}
        >
          <Send size={24} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGrey,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textDark,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.mutedGrey,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGrey,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  messageRole: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.mutedGrey,
  },
  userMessageRole: {
    color: Colors.white,
  },
  messageText: {
    fontSize: 15,
    color: Colors.textDark,
    lineHeight: 20,
  },
  userMessageText: {
    color: Colors.white,
  },
  loadingText: {
    fontSize: 15,
    color: Colors.mutedGrey,
    fontStyle: 'italic',
  },
  quickRepliesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGrey,
  },
  quickReplyButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    marginRight: 8,
  },
  quickReplyText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGrey,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textDark,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  recommendationsContainer: {
    marginTop: 16,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 12,
  },
  activityCardWrapper: {
    marginBottom: 12,
  },
});
