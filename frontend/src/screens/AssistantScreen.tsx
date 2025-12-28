import React, { useCallback, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList, Platform, Image } from 'react-native';
import { assistantQuery } from '../api/client';
import GradientBackground from '../components/GradientBackground';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  source?: 'llm' | 'template' | 'error';
};

const QUESTION_TYPES = [
  { key: 'general', label: '一般建议', emoji: '💬', color: '#6366F1' },
  { key: 'lifestyle', label: '生活方式', emoji: '🏃', color: '#8B5CF6' },
  { key: 'diet', label: '饮食营养', emoji: '🥗', color: '#10B981' },
  { key: 'sleep', label: '睡眠', emoji: '🌙', color: '#3B82F6' },
  { key: 'symptom', label: '症状咨询', emoji: '⚠️', color: '#F59E0B' },
];

export default function AssistantScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState('');
  const [qType, setQType] = useState<string>('general');
  const [loading, setLoading] = useState(false);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  const [streamedText, setStreamedText] = useState<string>('');
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);
  // 记录最后一次问题和类型,用于重试
  const [lastQuestion, setLastQuestion] = useState<string>('');
  const [lastQType, setLastQType] = useState<string>('general');

  const listRef = useRef<FlatList<Message>>(null);

  const append = useCallback((m: Message) => {
    setMessages((prev) => [...prev, m]);
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, []);

  // 流式输出函数
  const streamText = useCallback((fullText: string, msgId: string, source?: 'llm' | 'template') => {
    setStreamedText('');
    setStreamingMsgId(msgId);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setStreamedText(fullText.slice(0, i));
      if (i >= fullText.length) {
        clearInterval(interval);
        // 最终补全气泡
        setMessages((prev) => prev.map(m => m.id === msgId ? { ...m, text: fullText } : m));
        setStreamingMsgId(null);
      }
    }, 18 + Math.random() * 30); // 打字机速度
  }, []);

  const onSend = useCallback(async () => {
    const content = question.trim();
    if (!content || loading) return;
    setLastQuestion(content);
    setLastQType(qType);
    const userMsg: Message = { id: String(Date.now()), role: 'user', text: content };
    append(userMsg);
    setQuestion('');
    setLoading(true);
    try {
      const res = await assistantQuery(content, qType === 'general' ? undefined : qType);
      if (res?.disclaimer && !disclaimer) setDisclaimer(res.disclaimer);
      const text = res?.answer || '发生未知错误';
      const assistantMsg: Message = { id: userMsg.id + '-a', role: 'assistant', text: '', source: res?.source };
      append(assistantMsg);
      streamText(text, assistantMsg.id, res?.source);
    } catch (e: any) {
      append({ id: String(Math.random()), role: 'assistant', text: `请求失败：${e?.message || e}`, source: 'error' });
    } finally {
      setLoading(false);
    }
  }, [append, disclaimer, loading, qType, question, streamText]);

  // 重试逻辑
  const handleRetry = useCallback(async () => {
    if (loading || !lastQuestion) return;
    setLoading(true);
    try {
      const res = await assistantQuery(lastQuestion, lastQType === 'general' ? undefined : lastQType);
      if (res?.disclaimer && !disclaimer) setDisclaimer(res.disclaimer);
      const text = res?.answer || '发生未知错误';
      // 删除最后一个错误气泡，插入新气泡
      setMessages((prev) => {
        const filtered = prev.filter(m => !(m.role === 'assistant' && m.source === 'error'));
        const newMsg: Message = { id: String(Date.now()) + '-a', role: 'assistant', text: '', source: res?.source };
        return [...filtered, newMsg];
      });
      streamText(text, String(Date.now()) + '-a', res?.source);
    } catch (e: any) {
      setMessages((prev) => [...prev, { id: String(Math.random()), role: 'assistant', text: `请求失败：${e?.message || e}`, source: 'error' }]);
    } finally {
      setLoading(false);
    }
  }, [lastQuestion, lastQType, loading, disclaimer, streamText]);

  const renderItem = ({ item }: { item: Message }) => (
    <View style={[styles.bubble, item.role === 'user' ? styles.right : styles.left]}>
      {item.role === 'assistant' && item.source && item.source !== 'error' && (
        <Text style={item.source === 'llm' ? styles.badgeLlm : styles.badgeTemplate}>
          {item.source === 'llm' ? 'LLM' : 'TEMPLATE'}
        </Text>
      )}
      <Text style={[styles.bubbleTextStyle, item.role === 'user' ? styles.rightText : styles.leftText]}>
        {item.id === streamingMsgId ? streamedText : item.text}
      </Text>
      {/* 错误气泡下方显示重试按钮 */}
      {item.role === 'assistant' && item.source === 'error' && (
        <TouchableOpacity style={styles.retryBtn} onPress={() => handleRetry()}>
          <Text style={styles.retryText}>重试</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <GradientBackground>
      <View style={styles.container}>
      {/* 健康助手头部图片 */}
      <View style={styles.headerImageContainer}>
        <Image
          source={{ uri: 'https://maas-log-prod.cn-wlcb.ufileos.com/anthropic/cb006da4-ef18-4bf8-bbf4-fd0c50838294/f76c2f008eabbdc5981873307dd9e456.jpg?UCloudPublicKey=TOKEN_e15ba47a-d098-4fbd-9afc-a0dcf0e4e621&Expires=1763235070&Signature=4OT%2BzBJhfDNw1nFNg1Ap2jJwko%3D' }}
          style={styles.headerImage}
        />
        <View style={styles.headerOverlay}>
          <Text style={styles.headerTitle}>AI 健康助手</Text>
          <Text style={styles.headerSubtitle}>专业健康建议，随时为您服务</Text>
        </View>
      </View>

      {disclaimer ? (
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>{disclaimer}</Text>
        </View>
      ) : null}

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
              style={[
                styles.chip, 
                qType === item.key && { ...styles.chipActive, borderColor: item.color }
              ]}
            >
              <Text style={styles.chipEmoji}>{item.emoji}</Text>
              <Text style={[
                styles.chipText, 
                qType === item.key && { ...styles.chipTextActive, color: item.color }
              ]}>
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
          editable={!loading}
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={onSend} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendText}>发送</Text>}
        </TouchableOpacity>
      </View>
    </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  // 让全局渐变背景透出：完全透明背景
  container: { flex: 1, backgroundColor: 'transparent' },
  headerImageContainer: {
    height: 160,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
      },
    }),
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  disclaimerBox: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      },
    }),
  },
  disclaimerText: { 
    color: '#92400E', 
    fontSize: 13, 
    lineHeight: 18,
    fontWeight: '500',
  },
  bubble: {
    maxWidth: '78%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      },
    }),
  },
  left: { 
    alignSelf: 'flex-start', 
    backgroundColor: '#FFFFFF', 
    borderTopLeftRadius: 4,
  },
  right: { 
    alignSelf: 'flex-end', 
    backgroundColor: '#6366F1', 
    borderTopRightRadius: 4,
  },
  leftText: { color: '#111827', fontSize: 15, lineHeight: 21 },
  rightText: { color: '#fff', fontSize: 15, lineHeight: 21 },
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
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 3px rgba(0,0,0,0.1)',
      },
    }),
  },
  chipEmoji: {
    fontSize: 16,
  },
  chipText: { 
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: { 
    fontWeight: '700',
  },
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
      ios: {
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 4px rgba(99, 102, 241, 0.3)',
      },
    }),
  },
  sendText: { 
    color: '#fff', 
    fontWeight: '700',
    fontSize: 15,
  },
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
      ios: {
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 2px rgba(245, 158, 11, 0.15)',
      },
    }),
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  bubbleTextStyle: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
    flex: 1,
  },
});
