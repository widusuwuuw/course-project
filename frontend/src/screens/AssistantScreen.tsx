import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList, Platform, Image } from 'react-native';
import { assistantQuery } from '@/api/client';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GradientBackground from '@/components/GradientBackground';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  source?: 'llm' | 'template' | 'error';
  image_url?: string;
};

const QUESTION_TYPES = [
  { key: 'general', label: '一般建议', emoji: '💬', color: '#6366F1' },
  { key: 'lifestyle', label: '生活方式', emoji: '🏃', color: '#8B5CF6' },
  { key: 'diet', label: '饮食营养', emoji: '🥗', color: '#10B981' },
  { key: 'sleep', label: '睡眠', emoji: '🌙', color: '#3B82F6' },
  { key: 'symptom', label: '症状咨询', emoji: '⚠️', color: '#F59E0B' },
];

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  text: '你好！我是你的AI健康助手。有什么可以帮你的吗？',
  source: 'template'
};

export default function AssistantScreen() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [question, setQuestion] = useState('');
  const [qType, setQType] = useState<string>('general');
  const [loading, setLoading] = useState(false);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  const [streamedText, setStreamedText] = useState<string>('');
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);
  const [isReplying, setIsReplying] = useState(false);
  const [lastQuestion, setLastQuestion] = useState<string>('');
  const [lastQType, setLastQType] = useState<string>('general');

  const listRef = useRef<FlatList<Message>>(null);

  // Restore the disclaimer logic based on user's preference (show once per session)
  useEffect(() => {
    // This effect can be used for session-specific logic if needed in the future.
    // For now, the logic is handled in onSend/handleRetry.
  }, []);

  const handleClearChat = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
    setQuestion('');
    setLoading(false);
    setDisclaimer(null);
    setStreamedText('');
    setStreamingMsgId(null);
    setLastQuestion('');
    setLastQType('general');
  }, []);

  const append = useCallback((m: Message) => {
    setMessages((prev) => [...prev, m]);
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, []);

  const streamText = useCallback((fullText: string, msgId: string) => {
    setIsReplying(true);
    setStreamedText('');
    setStreamingMsgId(msgId);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setStreamedText(fullText.slice(0, i));
      if (i >= fullText.length) {
        clearInterval(interval);
        setMessages((prev) => prev.map(m => m.id === msgId ? { ...m, text: fullText } : m));
        setStreamingMsgId(null);
        setIsReplying(false);
      }
    }, 18 + Math.random() * 30);
  }, []);

  const onSend = useCallback(async () => {
    const content = question.trim();
    if (!content || loading || isReplying) return;
    setLastQuestion(content);
    setLastQType(qType);
    const userMsg: Message = { id: String(Date.now()), role: 'user', text: content };
    append(userMsg);
    setQuestion('');
    setLoading(true);
    try {
      const res = await assistantQuery(content, qType === 'general' ? undefined : qType, messages);
      if (res?.disclaimer && !disclaimer) setDisclaimer(res.disclaimer);
      const text = res?.answer || '发生未知错误';
      const assistantMsg: Message = {
        id: userMsg.id + '-a',
        role: 'assistant',
        text: '',
        source: res?.source,
        image_url: res?.image_url,
      };
      append(assistantMsg);
      streamText(text, assistantMsg.id);
    } catch (e: any) {
      append({ id: String(Math.random()), role: 'assistant', text: `请求失败：${e?.message || e}`, source: 'error' });
    } finally {
      setLoading(false);
    }
  }, [append, disclaimer, loading, isReplying, qType, question, streamText, messages]);

  const handleRetry = useCallback(async () => {
    if (loading || !lastQuestion) return;
    const newMsgId = Math.random().toString(36).substring(2, 9) + '-a';
    setLoading(true);
    try {
      const res = await assistantQuery(lastQuestion, lastQType === 'general' ? undefined : lastQType, messages);
      if (res?.disclaimer && !disclaimer) setDisclaimer(res.disclaimer);
      const text = res?.answer || '发生未知错误';
      setMessages((prev) => {
        const filtered = prev.filter(m => !(m.role === 'assistant' && m.source === 'error'));
        const newMsg: Message = {
          id: newMsgId,
          role: 'assistant',
          text: '',
          source: res?.source,
          image_url: res?.image_url,
        };
        return [...filtered, newMsg];
      });
      streamText(text, newMsgId);
    } catch (e: any) {
      setMessages((prev) => [...prev, { id: Math.random().toString(36).substring(2, 9), role: 'assistant', text: `请求失败：${e?.message || e}`, source: 'error' }]);
    } finally {
      setLoading(false);
    }
  }, [lastQuestion, lastQType, loading, disclaimer, isReplying, streamText, messages]);

  const renderItem = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageRow, isUser ? styles.messageRowRight : styles.messageRowLeft]}>
        {!isUser && (
          <View style={[styles.avatar, styles.assistantAvatar]}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#FFF" />
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.right : styles.left]}>
          {!isUser && item.source && item.source !== 'error' && (
            <Text style={item.source === 'llm' ? styles.badgeLlm : styles.badgeTemplate}>
              {item.source === 'llm' ? 'LLM' : 'TEMPLATE'}
            </Text>
          )}
          {isUser ? (
            <Text style={[styles.bubbleTextStyle, styles.rightText]}>
              {item.text}
            </Text>
          ) : (
            <>
              {item.image_url && <Image source={{ uri: item.image_url }} style={styles.richMediaImage} />}
              {(item.id === streamingMsgId && streamedText === '') ? (
                <ActivityIndicator size="small" color="#6366F1" />
              ) : (
                <Markdown style={markdownStyles}>
                  {item.id === streamingMsgId ? streamedText : item.text}
                </Markdown>
              )}
            </>
          )}
          {!isUser && item.source === 'error' && (
            <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
              <Text style={styles.retryText}>重试</Text>
            </TouchableOpacity>
          )}
        </View>
        {isUser && (
          <View style={[styles.avatar, styles.userAvatar]}>
            <Ionicons name="person-outline" size={20} color="#FFF" />
          </View>
        )}
      </View>
    );
  };

  return (
    <GradientBackground>
      <View style={styles.container}>
        <View style={styles.headerImageContainer}>
          <Image
            source={{ uri: 'https://maas-log-prod.cn-wlcb.ufileos.com/anthropic/cb006da4-ef18-4bf8-bbf4-fd0c50838294/f76c2f008eabbdc5981873307dd9e456.jpg?UCloudPublicKey=TOKEN_e15ba47a-d098-4fbd-9afc-a0dcf0e4e621&Expires=1763235070&Signature=4OT%2BzBJhfDNw1nFNg1Ap2jJwko%3D' }}
            style={styles.headerImage}
          />
          <View style={styles.headerOverlay}>
            <View>
              <Text style={styles.headerTitle}>AI 健康助手</Text>
              <Text style={styles.headerSubtitle}>专业健康建议，随时为您服务</Text>
            </View>
            <TouchableOpacity onPress={handleClearChat} style={styles.clearButton}>
              <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
        {disclaimer && (
          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerText}>{disclaimer}</Text>
          </View>
        )}
        <FlatList
          ref={listRef}
          contentContainerStyle={{ padding: 16 }}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
        />
        <View style={styles.toolbar}>
          <FlatList
            horizontal
            data={QUESTION_TYPES}
            keyExtractor={(t) => t.key}
            contentContainerStyle={{ paddingHorizontal: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setQType(item.key)}
                style={[styles.chip, qType === item.key && { ...styles.chipActive, borderColor: item.color }]}
              >
                <Text style={styles.chipEmoji}>{item.emoji}</Text>
                <Text style={[styles.chipText, qType === item.key && { ...styles.chipTextActive, color: item.color }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
          />
        </View>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="输入你的问题..."
            value={question}
            onChangeText={setQuestion}
            editable={!loading && !isReplying}
            multiline
            onKeyPress={(e) => {
              if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter') {
                e.nativeEvent.preventDefault();
                if (e.nativeEvent.ctrlKey) {
                  setQuestion(prev => prev + '\n');
                } else {
                  onSend();
                }
              }
            }}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={onSend} disabled={loading || isReplying}>
            {loading || isReplying ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendText}>发送</Text>}</TouchableOpacity>
        </View>
      </View>
    </GradientBackground>
  );
}

const markdownStyles = {
  body: { fontSize: 16, lineHeight: 22, color: '#111827' },
  heading1: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginTop: 10, marginBottom: 5 },
  heading2: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginTop: 8, marginBottom: 4 },
  heading3: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginTop: 6, marginBottom: 3 },
  strong: { fontWeight: 'bold' },
  em: { fontStyle: 'italic' },
  link: { color: '#3B82F6', textDecorationLine: 'underline' },
  list_item: { marginBottom: 4, lineHeight: 21 },
  bullet_list: { marginBottom: 8 },
  ordered_list: { marginBottom: 8 },
  paragraph: { marginTop: 0, marginBottom: 8 },
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  headerImageContainer: {
    height: 160,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
      android: { elevation: 6 },
      web: { boxShadow: '0 4px 8px rgba(0,0,0,0.15)' },
    }),
  },
  headerImage: { width: '100%', height: '100%' },
  headerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearButton: { padding: 8 },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginBottom: 4 },
  headerSubtitle: { color: 'rgba(255, 255, 255, 0.9)', fontSize: 14, fontWeight: '500' },
  disclaimerBox: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
      android: { elevation: 2 },
      web: { boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
    }),
  },
  disclaimerText: { color: '#92400E', fontSize: 13, lineHeight: 18, fontWeight: '500' },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10, maxWidth: '85%' },
  messageRowLeft: { alignSelf: 'flex-start' },
  messageRowRight: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
      android: { elevation: 2 },
      web: { boxShadow: '0 1px 2px rgba(0,0,0,0.1)' },
    }),
  },
  userAvatar: { backgroundColor: '#6366F1', marginLeft: 8 },
  assistantAvatar: { backgroundColor: '#10B981', marginRight: 8 },
  bubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
      android: { elevation: 2 },
      web: { boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
    }),
  },
  left: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 4 },
  right: { backgroundColor: '#6366F1', borderTopRightRadius: 4 },
  leftText: { color: '#111827', fontSize: 15, lineHeight: 21 },
  rightText: { color: '#fff', fontSize: 15, lineHeight: 21 },
  bubbleTextStyle: { fontSize: 16, lineHeight: 22 },
  toolbar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(229, 231, 235, 0.6)',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingVertical: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginVertical: 8,
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
      android: { elevation: 3 },
      web: { boxShadow: '0 2px 3px rgba(0,0,0,0.1)' },
    }),
  },
  chipEmoji: { fontSize: 16 },
  chipText: { color: '#6B7280', fontSize: 13, fontWeight: '600' },
  chipTextActive: { fontWeight: '700' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderTopColor: 'rgba(229, 231, 235, 0.6)',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    backgroundColor: 'rgba(249, 250, 251, 0.8)',
    borderWidth: 1.5,
    borderColor: 'rgba(229, 231, 235, 0.6)',
    borderRadius: 21,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
  },
  sendBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 21,
    ...Platform.select({
      ios: { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
      android: { elevation: 3 },
      web: { boxShadow: '0 2px 4px rgba(99, 102, 241, 0.3)' },
    }),
  },
  sendText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  badgeLlm: {
    alignSelf: 'flex-start',
    backgroundColor: '#059669',
    color: '#fff',
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  badgeTemplate: {
    alignSelf: 'flex-start',
    backgroundColor: '#6B7280',
    color: '#fff',
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  retryBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    ...Platform.select({
      ios: { shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2 },
      android: { elevation: 2 },
      web: { boxShadow: '0 1px 2px rgba(245, 158, 11, 0.15)' },
    }),
  },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14, letterSpacing: 0.5 },
  richMediaImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginTop: 5,
    marginBottom: 10,
    alignSelf: 'center',
    resizeMode: 'cover',
  },
});
