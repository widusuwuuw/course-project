import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiPost } from '@/api/client';
import GradientBackground from '@/components/GradientBackground';

const { width: screenWidth } = Dimensions.get('window');

// Message types
interface ChatMessage {
  id: string;
  text: string;
  type: 'user' | 'assistant' | 'system';
  timestamp: string;
  isTyping?: boolean;
}

// Predefined health question categories
const healthCategories = [
  {
    id: 'general',
    title: '一般健康咨询',
    icon: '💊',
    description: '日常健康问题咨询',
    color: '#3B82F6',
  },
  {
    id: 'lifestyle',
    title: '生活方式建议',
    icon: '🏃‍♂️',
    description: '运动、饮食、睡眠建议',
    color: '#10B981',
  },
  {
    id: 'symptoms',
    title: '症状分析',
    icon: '🩺',
    description: '症状描述和初步建议',
    color: '#F59E0B',
  },
];

export default function AssistantScreenV2Test() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      text: '您好！我是您的AI健康助手👋\n\n我可以为您提供：\n• 健康科普知识\n• 生活方式建议\n• 症状初步分析\n• 疾病预防指导\n\n请注意：我的回答仅供参考，不能替代专业医疗诊断。',
      type: 'assistant',
      timestamp: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      }),
    };
    setMessages([welcomeMessage]);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: text.trim(),
      type: 'user',
      timestamp: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      }),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Call AI assistant API
      const response = await apiPost('/assistant/query', {
        question: text.trim(),
        question_type: selectedCategory || 'general',
        user_profile: {
          // Add user profile if available
        }
      });

      const aiMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        text: response.answer || '抱歉，我现在无法回答这个问题，请稍后再试。',
        type: 'assistant',
        timestamp: new Date().toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit'
        }),
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error: any) {
      // Add error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        text: '抱歉，网络连接出现问题，请稍后再试。',
        type: 'system',
        timestamp: new Date().toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit'
        }),
      };

      setMessages(prev => [...prev, errorMessage]);
      console.error('AI Assistant Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    // Map frontend category IDs to backend question_type values
    const categoryMapping: { [key: string]: string } = {
      'general': 'general',
      'lifestyle': 'lifestyle',
      'symptoms': 'symptom',
    };

    const backendCategory = categoryMapping[categoryId] || 'general';
    setSelectedCategory(categoryId === selectedCategory ? null : backendCategory);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[
      styles.messageContainer,
      item.type === 'user' ? styles.userMessage : styles.assistantMessage
    ]}>
      <View style={[
        styles.bubble,
        item.type === 'user' ? styles.userBubble : styles.assistantBubble
      ]}>
        <Text style={[
          styles.messageText,
          item.type === 'user' ? styles.userText : styles.assistantText
        ]}>
          {item.text}
        </Text>
        {item.type === 'assistant' && (
          <Text style={styles.disclaimer}>
            ⚠️ 本回答仅供参考，不能替代专业医疗建议
          </Text>
        )}
      </View>
      <Text style={styles.timestamp}>{item.timestamp}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🤖 AI健康助手 V2</Text>
        <Text style={styles.subtitle}>专业、安全的健康咨询</Text>
      </View>

      {/* Category Selection */}
      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>选择咨询类型</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {healthCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && styles.categoryChipActive,
                { borderColor: category.color }
              ]}
              onPress={() => handleCategorySelect(category.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={[
                styles.categoryText,
                selectedCategory === category.id && { color: category.color }
              ]}>
                {category.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Chat Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      {/* Disclaimer Bar */}
      <View style={styles.disclaimerBar}>
        <Text style={styles.disclaimerBarText}>
          ⚠️ 本助手提供的信息仅供参考，不能替代专业医疗建议
        </Text>
      </View>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={styles.textInput}
          placeholder={
            selectedCategory
              ? `请输入${healthCategories.find(c => c.id === selectedCategory)?.title}相关问题...`
              : '请输入您的健康问题...'
          }
          placeholderTextColor="#9CA3AF"
          multiline
          maxLength={500}
          value={inputText}
          onChangeText={setInputText}
          textAlignVertical="center"
          blurOnSubmit={false}
          onSubmitEditing={() => {
            if (inputText.trim()) {
              sendMessage(inputText);
            }
          }}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || isLoading) && styles.sendButtonDisabled
          ]}
          onPress={() => sendMessage(inputText)}
          disabled={!inputText.trim() || isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.sendButtonText}>
            {isLoading ? '...' : '发送'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },

  // Categories section
  categoriesSection: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 8,
  },
  categoryChipActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryIcon: {
    fontSize: 20,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },

  // Messages list
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: screenWidth * 0.8,
  },
  userMessage: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    padding: 16,
    borderRadius: 20,
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: '#10B981',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: '#111827',
  },
  disclaimer: {
    fontSize: 11,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  timestamp: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },

  // Disclaimer bar
  disclaimerBar: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(251, 191, 36, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  disclaimerBarText: {
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
    lineHeight: 16,
  },

  // Input area
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    maxHeight: 100,
    minHeight: 48,
  },
  sendButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});