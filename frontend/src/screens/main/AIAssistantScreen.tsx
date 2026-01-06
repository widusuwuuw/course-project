import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../config';

const { width } = Dimensions.get('window');

// 消息类型定义
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  category?: string;
}

// 问题分类
const questionCategories = [
  {
    id: 'general',
    label: '💬 日常健康',
    description: '健康咨询、生活方式建议',
    icon: 'chatbubble-outline',
    color: '#4ABAB8',
  },
  {
    id: 'exercise',
    label: '🏃 运动健身',
    description: '运动指导、训练计划',
    icon: 'fitness-outline',
    color: '#FFD88C',
  },
  {
    id: 'nutrition',
    label: '🥗 营养饮食',
    description: '饮食搭配、营养建议',
    icon: 'restaurant-outline',
    color: '#D4EDD4',
  },
  {
    id: 'sleep',
    label: '🌙 睡眠健康',
    description: '睡眠质量、作息建议',
    icon: 'moon-outline',
    color: '#B8E5E5',
  },
  {
    id: 'symptom',
    label: '⚠️ 症状咨询',
    description: '症状分析、健康检查建议',
    icon: 'medical-outline',
    color: '#FFB5C5',
  },
];

// 预设问题模板
const presetQuestions = [
  '如何制定合适的运动计划？',
  '健康饮食的基本原则是什么？',
  '如何改善睡眠质量？',
  '哪些食物有助于提高免疫力？',
  '运动前后应该注意什么？',
];

export default function AIAssistantScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '您好！我是您的AI健康助手 👋\n\n我可以为您提供以下服务：\n• 健康生活建议\n• 运动健身指导\n• 营养饮食建议\n• 睡眠质量改善\n• 基础症状咨询\n\n请选择一个话题分类，或直接向我提问吧！',
      sender: 'assistant',
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // 获取系统提示词
  const getSystemPrompt = (category: string): string => {
    const prompts = {
      general: '你是一位专业的健康顾问，擅长日常健康管理和生活方式建议。',
      exercise: '你是一位专业的健身教练，擅长运动指导和训练计划制定。',
      nutrition: '你是一位专业的营养师，擅长饮食搭配和营养建议。',
      sleep: '你是一位专业的睡眠顾问，擅长睡眠质量改善和作息建议。',
      symptom: '你是一位专业的医疗顾问，擅长基础症状分析和健康检查建议。请注意你不能替代医生诊断，建议严重症状及时就医。'
    };

    return prompts[category] || prompts.general;
  };

  // 发送消息到AI
  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim()) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: userMessage,
      sender: 'user',
      timestamp: new Date(),
      category: selectedCategory || undefined,
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputText('');
    setIsLoading(true);

    // 滚动到底部
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // 获取保存的token
      const token = await AsyncStorage.getItem('userToken');

      // 映射前端分类到后端分类
      const categoryMap: Record<string, string> = {
        'general': 'general',
        'exercise': 'lifestyle',
        'nutrition': 'diet',
        'sleep': 'sleep',
        'symptom': 'symptom',
      };

      // 构建API请求 - 调用正确的后端路由 /assistant/query
      const response = await fetch(`${API_BASE_URL}/assistant/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: userMessage,
          question_type: categoryMap[selectedCategory || 'general'] || 'general',
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.answer,  // 后端返回的是 answer 字段，不是 reply
        sender: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error sending message:', error);

      // 错误回复
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: '抱歉，我现在遇到了一些技术问题。请稍后再试，或者您可以尝试重新描述您的问题。',
        sender: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);

      // 滚动到底部
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  };

  // 选择问题分类
  const selectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);

    const categoryGreeting = `好的，我将为您提供${questionCategories.find(c => c.id === categoryId)?.label}相关的建议。请告诉我您想了解什么？`;

    const categoryMessage: Message = {
      id: Date.now().toString(),
      text: categoryGreeting,
      sender: 'assistant',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, categoryMessage]);
  };

  // 渲染消息
  const renderMessage = (message: Message) => (
    <View key={message.id} style={[
      styles.messageContainer,
      message.sender === 'user' ? styles.userMessage : styles.assistantMessage
    ]}>
      {message.sender === 'assistant' && (
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={['#4ABAB8', '#B8E5E5']}
            style={styles.avatar}
          >
            <Ionicons name="chatbubble" size={20} color="#FFFFFF" />
          </LinearGradient>
        </View>
      )}

      <View style={[
        styles.messageBubble,
        message.sender === 'user' ? styles.userBubble : styles.assistantBubble
      ]}>
        <Text style={[
          styles.messageText,
          message.sender === 'user' ? styles.userMessageText : styles.assistantMessageText
        ]}>
          {message.text}
        </Text>
        <Text style={message.sender === 'user' ? styles.messageTime : styles.messageTimeAssistant}>
          {message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>

      {message.sender === 'user' && (
        <View style={styles.avatarContainer}>
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={20} color="#FFFFFF" />
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F8FAFB' }]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* 头部信息 */}
        <View style={styles.header}>
          <LinearGradient
            colors={['#4ABAB8', '#B8E5E5']}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <TouchableOpacity 
                style={styles.headerBackButton} 
                onPress={() => {
                  // 如果已选择分类或有对话历史，先返回到初始状态
                  if (selectedCategory || messages.length > 1) {
                    setSelectedCategory(null);
                    setMessages([{
                      id: '1',
                      text: '您好！我是您的AI健康助手 👋\n\n我可以为您提供以下服务：\n• 健康生活建议\n• 运动健身指导\n• 营养饮食建议\n• 睡眠质量改善\n• 基础症状咨询\n\n请选择一个话题分类，或直接向我提问吧！',
                      sender: 'assistant',
                      timestamp: new Date(),
                    }]);
                    setInputText('');
                  } else {
                    // 否则返回上一页
                    navigation.goBack();
                  }
                }}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.headerInfo}>
                <Text style={styles.headerTitle}>AI健康助手</Text>
                <Text style={styles.headerSubtitle}>专业的健康管理建议</Text>
              </View>
              <TouchableOpacity style={styles.infoButton}>
                <Ionicons name="information-circle-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* 免责声明 */}
          <View style={styles.disclaimer}>
            <Ionicons name="warning-outline" size={16} color="#F59E0B" />
            <Text style={styles.disclaimerText}>
              本助手仅提供健康建议，不能替代专业医疗诊断
            </Text>
          </View>
        </View>

        {/* 问题分类选择 */}
        {messages.length === 1 && (
          <View style={styles.categoriesSection}>
            <Text style={styles.categoriesTitle}>选择您想咨询的话题</Text>
            <View style={styles.categoriesGrid}>
              {questionCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryCard}
                  onPress={() => selectCategory(category.id)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[category.color + '20', category.color + '10']}
                    style={styles.categoryIcon}
                  >
                    <Ionicons
                      name={category.icon as keyof typeof Ionicons.glyphMap}
                      size={24}
                      color={category.color}
                    />
                  </LinearGradient>
                  <Text style={styles.categoryLabel}>{category.label}</Text>
                  <Text style={styles.categoryDescription} numberOfLines={2}>
                    {category.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 预设问题 */}
        {!selectedCategory && messages.length === 1 && (
          <View style={styles.presetSection}>
            <Text style={styles.presetTitle}>常见问题</Text>
            <View style={styles.presetQuestions}>
              {presetQuestions.map((question, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.presetQuestion}
                  onPress={() => sendMessage(question)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.presetQuestionText}>{question}</Text>
                  <Ionicons name="send-outline" size={16} color="#4ABAB8" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 消息列表 */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(renderMessage)}

          {isLoading && (
            <View style={[styles.messageContainer, styles.assistantMessage]}>
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={['#4ABAB8', '#B8E5E5']}
                  style={styles.avatar}
                >
                  <Ionicons name="chatbubble" size={20} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <View style={styles.loadingBubble}>
                <View style={styles.typingIndicator}>
                  <View style={styles.typingDot} />
                  <View style={styles.typingDot} />
                  <View style={styles.typingDot} />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* 输入区域 */}
        <View style={styles.inputSection}>
          {selectedCategory && (
            <View style={styles.categoryTag}>
              <Text style={styles.categoryTagText}>
                {questionCategories.find(c => c.id === selectedCategory)?.label}
              </Text>
              <TouchableOpacity onPress={() => setSelectedCategory(null)}>
                <Ionicons name="close-circle" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="请描述您的问题..."
              placeholderTextColor="#9CA3AF"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              textAlignVertical="center"
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isLoading) && styles.sendButtonDisabled
              ]}
              onPress={() => sendMessage(inputText)}
              disabled={!inputText.trim() || isLoading}
            >
              <Ionicons
                name="send"
                size={20}
                color={inputText.trim() && !isLoading ? '#FFFFFF' : '#D1D5DB'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
  },
  headerGradient: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  infoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FEF3C7',
    gap: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },
  categoriesSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoriesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  categoryCard: {
    width: (width - 56) / 2,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  categoryDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  presetSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  presetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  presetQuestions: {
    gap: 8,
  },
  presetQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  presetQuestionText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  messagesContent: {
    padding: 16,
    gap: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    gap: 12,
    maxWidth: width - 32,
  },
  userMessage: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    marginTop: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4ABAB8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    flex: 1,
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    gap: 4,
  },
  userBubble: {
    backgroundColor: '#4ABAB8',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  assistantMessageText: {
    color: '#1F2937',
  },
  messageTime: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    alignSelf: 'flex-end',
  },
  messageTimeAssistant: {
    color: '#9CA3AF',
  },
  loadingBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  typingIndicator: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ABAB8',
    opacity: 0.4,
  },
  inputSection: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    padding: 16,
    gap: 12,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  categoryTagText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    maxHeight: 100,
    minHeight: 20,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4ABAB8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
});